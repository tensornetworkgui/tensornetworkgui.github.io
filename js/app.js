// Copyright 2019 The TensorNetwork Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

let app = new Vue({
    el: '#app',
    mixins: [mixinDelete],
    data: {
        state: initialState, // now state object is reactive, whereas initialState is not
        pastStates: [], // used for undo
        futureStates: [], // used for redo
        undoing: false,
        redoing: false,
        help: false
    },
    methods: {
        newWorkspace: function(event) {
            if (event != null) {
                event.preventDefault();
            }
            let proceed = window.confirm("Are you sure you want to delete this workspace and start a new one?");
            if (proceed) {
                window.localStorage.setItem("state", null);
                this.state = JSON.parse(JSON.stringify(initialState));
            }
        },
        exportSVG: function(event) {
            if (event != null) {
                event.preventDefault();
            }
            let serializer = new XMLSerializer();
            let workspace = document.getElementById('workspace');
            let savedState = document.getElementById('saved-state');
            savedState.textContent = JSON.stringify(this.state);
            let blob = new Blob([serializer.serializeToString(workspace)], {type:"image/svg+xml;charset=utf-8"});
            let url = URL.createObjectURL(blob);
            let link = document.createElement('a');
            link.href = url;
            link.download = "export.svg";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            savedState.textContent = '';
        },
        loadFile: function() {
            let file = document.getElementById('load-file').files[0];
            let reader = new FileReader();
            reader.readAsText(file, 'UTF-8');
            let t = this;
            reader.onload = function(event) {
                let svgString = event.target.result;
                let parser = new DOMParser();
                let svg = parser.parseFromString(svgString, 'image/svg+xml');
                let savedState = svg.getElementById('saved-state');
                if (savedState == null || savedState.textContent == ''
                    || savedState.textContent == null) {
                    alert("ERROR: Could not find a saved workspace inside " + file.name);
                }
                else {
                    try {
                        t.state = JSON.parse(savedState.textContent);
                    }
                    catch (e) {
                        alert("ERROR: Could not read the saved workspace inside " + file.name);
                    }
                }
            };
            reader.onerror = function(event) {
                console.error(event.target.result);
            };
            document.getElementById('load-file').value = null;
        },
        undo: function(event) {
            if (this.pastStates.length > 1) {
                this.undoing = true;
                this.futureStates.push(JSON.stringify(this.state));
                this.pastStates.pop();
                this.state = JSON.parse(this.pastStates[this.pastStates.length - 1]);
            }
        },
        redo: function(event) {
            if (this.futureStates.length > 0) {
                this.redoing = true;
                this.state = JSON.parse(this.futureStates.pop());
            }
        },
        openHelp: function(event) {
            event.preventDefault();
            this.help = true;
        },
        closeHelp: function() {
            this.help = false;
        },
        keyPressed: function(event) {
            let char;
            if (event.which == null) {
                char = String.fromCharCode(event.keyCode);
            }
            else if (event.which !== 0 && event.charCode !== 0) {
                char = String.fromCharCode(event.which);
            }
            if (char === 'n') {
                this.newWorkspace();
            }
            else if (char === 'e') {
                this.exportSVG();
            }
            else if (char === 'o') {
                document.getElementById('load-file').click();
            }
            else if (char === 'z') {
                this.undo();
            }
            else if (char === 'r') {
                this.redo();
            }
            else if (char === 'c') {
                document.getElementById('copy-button').click();
            }
            else if (char === 'a') {
                let allNodes = [];
                this.state.nodes.forEach(function(node) {
                    allNodes.push(node);
                });
                this.state.selectedNodes = allNodes;
            }
            else if (char === 'd') {
                this.state.selectedNodes = [];
            }
        },
        keyDown: function(event) {
            if (event.key === 'Backspace') {
                this.deleteSelectedNodes();
            }
        }
    },
    mounted: function() {
        let savedState = window.localStorage.getItem("state");
        if (savedState != null) {
            try {
                this.state = JSON.parse(savedState);
            }
            catch (e) {
            }
        }
        else {
            // First-time user; load example state
            this.state.nodes = JSON.parse(JSON.stringify(exampleState.nodes));
            this.state.edges = JSON.parse(JSON.stringify(exampleState.edges));
        }
        document.addEventListener('keypress', this.keyPressed);
        document.addEventListener('keydown', this.keyDown);
    },
    watch: {
        state: {
            handler: function() {
                if (this.state.draggingNode) {
                    return;
                }
                let encodedState = JSON.stringify(this.state);
                window.localStorage.setItem("state", encodedState);
                if (!this.undoing) {
                    this.pastStates.push(encodedState);
                }
                if (!this.undoing && !this.redoing) {
                    this.futureStates = [];
                }
                this.undoing = false;
                this.redoing = false;
            },
            deep: true
        }
    },
    template: `
        <div class="app">
			<workspace :state="state" />
			<grid :state="state" />
			<div class="controls">
                <a href="" class="new-workspace" @click="newWorkspace">New Workspace</a>
                <a href="" class="export" @click="exportSVG">Export SVG</a>
                <span class="checkbox-holder">
                    <input type="checkbox" id="checkbox-snapToGrid" v-model="state.snapToGrid">
                    <label for="checkbox-snapToGrid">Snap to grid</label>
                </span>
                <label for="load-file">Open SVG</label>
                <input type="file" id="load-file" accept="image/svg+xml" @change="loadFile($event.target.files)">
                <button @click="undo" :disabled="pastStates.length <= 1">Undo</button>
                <button @click="redo" :disabled="futureStates.length === 0">Redo</button>
                <a href="" class="export" @click="openHelp">Help</a>
            </div>
			<toolbar :state="state" />
            <code-output :state="state" />
            <help-window :open="help" @close="closeHelp()" />
        </div>

    `
});

Vue.component(
    'help-window',
    {
        props: {
            open: Boolean
        },
        methods: {
            close: function(event) {
                event.preventDefault();
                this.$emit('close');
            }
        },
        template: `
            <div class="help-window" v-if="open">
                <a class="delete" href="" @click="close">close</a>
                <h2>Help</h2>
                <h3>Hotkeys</h3>
                <ul>
                    <li><strong>N</strong> - new workspace</li>
                    <li><strong>E</strong> - export SVG</li>
                    <li><strong>O</strong> - open SVG</li>
                    <li><strong>Z</strong> - undo</li>
                    <li><strong>R</strong> - redo</li>
                    <li><strong>C</strong> - copy code output to clipboard</li>
                    <li><strong>A</strong> - select all nodes</li>
                    <li><strong>D</strong> - deselect nodes</li>
                    <li><strong>Backspace</strong> - delete selected nodes</li>
                </ul>
            </div>
        `
    }
);
