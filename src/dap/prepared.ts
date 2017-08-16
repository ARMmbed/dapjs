import {ApReg, DapVal, Reg} from "./constants";

import {CMSISDAP, DapCmd} from "../transport/cmsis_dap";
import {addInt32, apReg, bank, readUInt32LE, regRequest} from "../util";

/**
 * # Prepared DAP Command
 *
 * Batches together multiple Debug Access Port (DAP) commands into one (or more)
 * CMSIS-DAP Transfers that can be written together to improve link utilisation.
 *
 * > **NOTE:** this will not normally need to be used by applications or libraries
 * > depending on DAP.js.
 *
 * ## Architecture
 *
 * - `PreparedDapCommand` keeps a list of CMSIS-DAP `Transfer` commands.
 * - Every time an action is scheduled (writing to or reading from a DP or AP register),
 * we check to see if there is any remaining room in the current batch, starting a new
 * batch if none is available.
 * - When `go` is called, the batches are executed sequentially (so DAP commands are
 * executed in the order they were added).
 *
 * ### Reading Values
 *
 * Writing values to registers is relatively straight forward, however mixing register
 * reads and writes together requires us to keep track of how many commands in
 * each batch are read commands.
 *
 * Once data has successfully been read back from the target, the values read are assembled
 * into an array, and returned in the order they requested. This allows `PreparedDapCommand`s
 * to be used higher up the stack in places where multiple independent read operations take
 * place sequentially.
 *
 * ### Constructing CMSIS-DAP Commands
 *
 * We keep track of the number of commands in each batch, so that we can fill in the command
 * count field of the `DAP_Transfer`.
 */
export class PreparedDapCommand {
    private commands: number[][];
    private readCounts: number[];
    private currentCommand: number;
    private commandCounts: number[];

    private dpSelect: number;
    private csw: number;

    constructor(private dap: CMSISDAP) {
        this.commands = [[0, 1]];
        this.commandCounts = [0];
        this.currentCommand = 0;
        this.readCounts = [0];
    }

    /**
     * Schedule a value to be written to an AP or DP register.
     *
     * @param regId register ID to be written to
     * @param value value to be written
     */
    public writeReg(regId: Reg, value: number) {
        const request = regRequest(regId, true);

        if (this.commands[this.currentCommand].length + 5 > 64) {
            // start a new command
            this.commands.push([0, 1]);
            this.commandCounts.push(0);
            this.readCounts.push(0);
            this.currentCommand++;
        }

        this.commands[this.currentCommand].push(request);
        addInt32(this.commands[this.currentCommand], value);

        this.commandCounts[this.currentCommand]++;
    }

    /**
     * Schedule a value to be read from an AP or DP register.
     * @param regId register to read from
     */
    public readReg(regId: Reg) {
        const request = regRequest(regId, false);

        if (this.commands[this.currentCommand].length + 1 > 64) {
            // start a new command
            this.commands.push([0, 1]);
            this.commandCounts.push(0);
            this.readCounts.push(0);
            this.currentCommand++;
        }

        this.commands[this.currentCommand].push(request);

        this.commandCounts[this.currentCommand]++;
        this.readCounts[this.currentCommand]++;
    }

    /**
     * Schedule multiple values to be written to the same register.
     *
     * **TODO:** figure out dynamically whether it's better to use DAP_TransferBlock vs
     * DAP_Transfer. We should be able to fill up the remaining space in a Transfer
     * and then start a TransferBlock _if_ we can fit in _13 or more_ values into the
     * TransferBlock. However, the gains from this are marginal unless we're using much
     * larger packet sizes than 64 bytes.
     *
     * @param regId register to write to repeatedly
     * @param data array of 32-bit values to be written
     */
    public writeRegRepeat(regId: Reg, data: Uint32Array) {
        // fill up the rest of the command we have left
        data.forEach((cmd) => {
            this.writeReg(regId, cmd);
        });
    }

    /**
     * Asynchronously execute the commands scheduled.
     */
    public async go(): Promise<number[]> {
        const v: number[] = [];

        for (let i = 0; i < this.commands.length; i++) {
            const command = this.commands[i];
            command[1] = this.commandCounts[i];

            const result = await this.dap.cmdNums(DapCmd.DAP_TRANSFER, command);

            for (let j = 0; j < this.readCounts[i]; j++) {
                v.push(readUInt32LE(result, 3 + 4 * j));
            }
        }

        return v;
    }

    /**
     * Schedule a value to be written to a DP register
     *
     * @param addr Address to write to
     * @param data Data to be written
     */
    public writeDp(addr: Reg, data: number) {
        if (addr === Reg.SELECT) {
            if (data === this.dpSelect) {
                return Promise.resolve();
            }

            this.dpSelect = data;
        }

        return this.writeReg(addr, data);
    }

    /**
     * Schedule a value to be written to an AP register
     *
     * @param addr Address to write to
     * @param data Data to be written
     */
    public writeAp(addr: ApReg, data: number) {
        this.writeDp(Reg.SELECT, bank(addr));

        if (addr === ApReg.CSW) {
            if (data === this.csw) {
                return Promise.resolve();
            }

            this.csw = data;
        }

        this.writeReg(apReg(addr, DapVal.WRITE), data);
    }

    /**
     * Schedule a DP register to read from
     *
     * @param addr Address to read from
     */
    public readDp(addr: Reg) {
        return this.readReg(addr);
    }

    /**
     * Schedule an AP register to read from
     *
     * @param addr Address to read from
     */
    public readAp(addr: ApReg) {
        this.writeDp(Reg.SELECT, bank(addr));
        return this.readReg(apReg(addr, DapVal.READ));
    }
}
