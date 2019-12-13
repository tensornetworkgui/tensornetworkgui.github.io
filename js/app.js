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
    data: {
        state: initialState // now state object is reactive, whereas initialState is not
    },
    methods: {
        newWorkspace: function(event) {
            event.preventDefault();
            let proceed = window.confirm("Are you sure you want to delete this workspace and start a new one?");
            if (proceed) {
                window.localStorage.setItem("state", null);
                this.state = JSON.parse(JSON.stringify(initialState));
            }
        },
        exportSVG: function(event) {
            event.preventDefault();
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
            }
            reader.onerror = function(event) {
                console.error(event.target.result);
            }
            document.getElementById('load-file').value = null;
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
    },
    watch: {
        state: {
            handler: function() {
                window.localStorage.setItem("state", JSON.stringify(this.state));
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
                <label for="load-file">Load workspace from SVG</label>
                <input type="file" id="load-file" accept="image/svg+xml" @change="loadFile($event.target.files)">
            </div>
			<toolbar :state="state" />
            <code-output :state="state" />
        </div>

    `
});
