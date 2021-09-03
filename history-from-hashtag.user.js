// ==UserScript==
// @name        CtrlH
// @version     1.0
// @author      MathEnthusiast314
// @description Desmos Graph History
// @grant       none
// @match       https://*.desmos.com/calculator*
// @downloadURL https://github.com/MathEnthusiast314/desmos-history/blob/main/history-from-hashtag.user.js
// @updateURL https://github.com/MathEnthusiast314/desmos-history/blob/main/history-from-hashtag.user.js
// ==/UserScript==
// Thanks to SlimRunner, the GUI for this project is adapted from: https://github.com/SlimRunner/desmos-pickler 

(function() {
	'use strict';
	var Calc;

	defineScript();

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
	// Global data structures & objects

	const FILE_SIGNATURE = 'PCKL';
	const QRY_MAIN_CONT = '#graph-container .dcg-container';
	var ctrs;

	// creates an error with custom name
	class CustomError extends Error {
		/* Source
		* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
		*/
		constructor(name, ...params) {
			// Pass remaining arguments (including vendor specific ones) to parent constructor
			super(...params);

			// Maintains proper stack trace for where our error was thrown (only available on V8)
			if (Error.captureStackTrace) {
				Error.captureStackTrace(this, CustomError);
			}

			this.name = name;
		}
	}

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
	// GUI Management - Main

	// Initializes the script GUI
	function initGUI() {
		let graphContainer = document.querySelector(QRY_MAIN_CONT);
		if (graphContainer == null) {
			throw new CustomError(
				'Page Error',
				'Graph containter was not found'
			);
		}

		insertNodes(document.head, {
			group : [{
				tag : 'style',
				id : 'ctrlh-script-stylesheet',
				attributes : [
					{name: 'type', value: 'text/css'}
				],
				nodeContent :
				`.dpk-sli-prop-menu {
					display: flex;
					gap: 8px;

					position: fixed !important;
					transition: opacity 0.1s ease-out;

					padding: 0px;
				}

				.dpk-sli-menu-button {
					background: #ededed;
					padding: 5px;
					width: 38px;
					height: 38px;
				}

				.dpk-sli-dcg-icon-align {
					text-align: center;
					line-height: 2em;
				}

				.dpk-sli-file-label input[type="file"] {
					display: none;
				}`
			}]
		})

		// https://stackoverflow.com/a/25825731
		ctrs = insertNodes(graphContainer, {
			group: [{
				tag: 'div',
				varName: 'drawerMenu',
				classes : [
					'dpk-sli-prop-menu'
				],
				group: [{
					tag: 'label',
					attributes: [
						{name: 'title', value: 'Load hashtag'}
					],
					classes : [
						'dpk-sli-menu-button',
						'dpk-sli-dcg-icon-align',
						'dpk-sli-file-label',
						'dcg-btn-flat-gray'
					],
					group : [{
						tag: 'img',
						varName: 'loadButton',
						attributes: [

						]
					},{
						tag : 'i',
                        varName: 'loadButton',
						classes : [
							'dcg-icon-reset'
						]
					}]
				}]
			}]
		});

		let cnSizeObs = new ResizeObserver((ents) => {
			resizeDrawer(ents[0].target.getBoundingClientRect());
		});

		cnSizeObs.observe(
			document.querySelector('canvas.dcg-graph-inner')
		);

	}

	// moves the GUI buttons in sync with Desmos GUI
	function resizeDrawer(cnRect) {
		let x, y;
		let pillbox = document.querySelector(
			'div.dcg-overgraph-pillbox-elements'
		);

		if (pillbox != null) {
			let pbRect = pillbox.getBoundingClientRect();
			let dwRect = ctrs.drawerMenu.getBoundingClientRect();

			x = pbRect.left - dwRect.width - 8;
			y = pbRect.top + 3;
		} else {
			let dwRect = ctrs.drawerMenu.getBoundingClientRect();
			x = cnRect.left + cnRect.width - dwRect.width - 5;
			y = cnRect.top + 5;
		}

		Object.assign(ctrs.drawerMenu.style, {
			left: x + 'px',
			top: y + 'px'
		});
	}

	// initializes the event handlers of the GUI
	function loadHandlers() {
		ctrs.loadButton.addEventListener('click', (evt) => {
            console.log("Please Wait...");
            (function () {const start = Calc._calc.globalHotkeys.mygraphsController.graphsController.currentGraph.hash; var notetext = 'Graph History\n'; var count = 0;
            (async () => {
            let cur = start;
            while (true){
            count++;
            notetext+=count+`.https://www.desmos.com/calculator/${cur}`+'\n';
            const html = await (await fetch(`https://www.desmos.com/calculator/${cur}`)).text();
            const matches = html.match(/quot;parent_hash&quot;:&quot;([a-z0-9]{10,20})&quot;/);
            if (!matches){
            {const state = Calc.getState(); state.expressions.list.unshift({
                "type": "text",
                "text": notetext
            }); Calc.setState(state, {allowUndo: true})}
            console.log("Graph History loaded into Expression 1");
            break}
            cur = matches[1];}})();})();

		});

		
	}

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
	// Encoding & Data Parsing



	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
	// Helper functions

	// creates a tree of elements and appends them into parentNode. Returns an object containing all named nodes
	function insertNodes(parentNode, nodeTree) {
		function recurseTree (parent, nextTree, nodeAdder) {
			for (let branch of nextTree.group) {
				if (!branch.hasOwnProperty('tag')) {
					throw new CustomError('Parameter Error', 'Tag type is not defined');
				}
				let child = document.createElement(branch.tag);
				parent.appendChild(child);

				if (branch.hasOwnProperty('varName')) {
					nodeAdder[branch.varName] = child;
				}
				if (branch.hasOwnProperty('id')) {
					child.setAttribute('id', branch.id);
				}
				if (branch.hasOwnProperty('classes')) {
					child.classList.add(...branch.classes);
				}
				if (branch.hasOwnProperty('styles')) {
					Object.assign(child.style, branch.styles);
				}
				if (branch.hasOwnProperty('attributes')) {
					branch.attributes.forEach(elem => {
						child.setAttribute(elem.name, elem.value);
					});
				}
				if (branch.hasOwnProperty('nodeContent')) {
					child.innerHTML = branch.nodeContent;
				}
				if (branch.hasOwnProperty('group')) {
					recurseTree(child, branch, nodeAdder); // they grow so fast :')
				}
			}
			return nodeAdder;
		}
		return recurseTree(parentNode, nodeTree, []);
	}



	// returns the current name of the graph
	function getGraphName() {
		// return document.querySelector('span.dcg-variable-title').innerText;
		// courtesy of fireflame241#3111
		return Calc
			._calc
			.globalHotkeys
			.headerController
			.graphsController
			.currentGraph
			.title || 'untitled';
	}




	// DesmosLoader script by Cyan
	function loadScripts(Calc) {
		let exprs = Array.from(Calc.getState().expressions.list);
		let first = exprs[0];
		if (first.type === 'text') {
			let text = first.text;
			let textsplit = text.split('\n').filter(
				line => line.startsWith('include ')
			).map(line => line.slice(8));
			let folders = exprs.filter((expr) => expr.type === 'folder');
			if (
				textsplit.length > 0 &&
				confirm(`This graph contains a script.\n\nDo you want to load the script?`)
			) {
				Calc.observe('expressionAnalysis.scriptRun', () => {
					Calc.unobserve('expressionAnalysis.scriptRun');
					for (const line of textsplit) {
						let folder = folders.find(folder => folder.title === line);
						let matchfolderid = folder ? folder.id : '';
						let texts = exprs.filter(expr => (expr.type == 'text' && expr.folderId === matchfolderid));
						for (const code of texts) {
							window.eval(code.text);
						}
					}
				});
			}
		}
	}

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
	// User-Script Initialization

	// defines an object that is shared among my scripts
	function defineScript() {
		if (window.SLM === undefined) {
			console.log(
				'scripts by\n' +
				'𝕄𝕒𝕥𝕙𝔼𝕟𝕥𝕙𝕦𝕤𝕚𝕒𝕤𝕥𝟛𝟙𝟜'
			);

			window.SLM = Object.assign({}, {
				messages: [],
				scripts: [GM_info.script.name],

				printMsgQueue: function() {
					while (this.printMessage()) { }
				},

				printMessage: function() {
					if (this.messages.length === 0) return false;
					let msg = this.messages.shift();
					console[msg.type](...msg.args);
					return this.messages.length !== 0;
				},

				pushMessage: function(type, ...msgArgs) {
					this.messages.push({
						type: type,
						args: msgArgs
					});
				}
			});

			Object.defineProperties(window.SLM, {
				MESSAGE_DELAY : {
					value: 500,
					writable: false,
					enumerable: true,
					configurable: true
				},
				ATTEMPTS_LIMIT : {
					value: 50,
					writable: false,
					enumerable: true,
					configurable: true
				},
				ATTEMPTS_DELAY : {
					value: 200,
					writable: false,
					enumerable: true,
					configurable: true
				}
			});
		} else {
			window.SLM.scripts.push(GM_info.script.name);
		}
	}

	// checks if calc and desmos are defined
	function isCalcReady() {
		if (
			window.Desmos !== undefined &&
			window.Calc !== undefined
		) {
			Calc = window.Calc;
			return true;
		} else {
			return false;
		}
	}

	// iife that checks if Desmos has finished loading (10 attempts)
	(function loadCheck () {
		const SLM = window.SLM;

		if (loadCheck.attempts === undefined) {
			loadCheck.attempts = 0;
		} else {
			loadCheck.attempts++;
		}

		if (!isCalcReady()) {
			if (loadCheck.attempts < SLM.ATTEMPTS_LIMIT) {
				window.setTimeout(loadCheck, SLM.ATTEMPTS_DELAY);
			} else {
				SLM.pushMessage('warn', '%s aborted loading', GM_info.script.name);
				setTimeout(() => {
					SLM.printMsgQueue();
				}, SLM.MESSAGE_DELAY);
			}

		} else {

			try {

				initGUI();
				loadHandlers();

				SLM.pushMessage('log', '%s loaded properly ✔️', GM_info.script.name);
			} catch (ex) {
				SLM.pushMessage('error', `${ex.name}: ${ex.message}`);
				SLM.pushMessage('warn', 'An error was encountered while loading');
			} finally {
				setTimeout(() => {
					SLM.printMsgQueue();
				}, SLM.MESSAGE_DELAY);
			}

		}
	}());
}());
