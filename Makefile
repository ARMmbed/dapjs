all:
	node node_modules/typescript/bin/tsc
	browserify built/main.js --standalone DAPjs > built/dap.bundle.js
