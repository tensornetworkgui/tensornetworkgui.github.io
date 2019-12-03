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
            let blob = new Blob([serializer.serializeToString(workspace)], {type:"image/svg+xml;charset=utf-8"});
            let url = URL.createObjectURL(blob);
            let link = document.createElement('a');
            link.href = url;
            link.download = "export.svg";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
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
            </div>
			<toolbar :state="state" />
            <code-output :state="state" />
        </div>

    `
});
