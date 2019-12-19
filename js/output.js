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

Vue.component(
    'code-output',
	{
        props: {
            state: Object
        },
        data: function() {
            return {
                ncon: true, // Use ncon() in output code.
                copied: false
            }
        },
        created: function() {
            window.hl
        },
        computed: {
            outputCode: function() {
                let code = `import numpy as np\nimport tensornetwork as tn\n`;

                code += `\n# Node definitions\n`;
                code += `# TODO: replace np.zeros with actual values\n\n`;

                for (let i = 0; i < this.state.nodes.length; i++) {
                    let node = this.state.nodes[i];
                    let values = this.placeholderValues(node);
                    let axes = this.axisNames(node);
                    code += `${node.name} = tn.Node(${values}, name="${node.name}"${axes})\n`;
                }

                code += `\n# Edge definitions\n\n`;

                if (this.ncon) {
                    let tensors = [];
                    let network_structure = [];
                    let danglingIndex = -1;
                    for (let i = 0; i < this.state.nodes.length; i++) {
                        let node = this.state.nodes[i];
                        tensors.push(node.name);
                        let indices = [];
                        for (let axis = 0; axis < node.axes.length; axis++) {
                            let connected = false;
                            for (let j = 0; j < this.state.edges.length; j++) {
                                let edge = this.state.edges[j];
                                if ((edge[0][0] === node.name && edge[0][1] === axis)
                                    || (edge[1][0] === node.name && edge[1][1] === axis)) {
                                    indices.push(j + 1);
                                    connected = true;
                                    break;
                                }
                            }
                            if (!connected) {
                                indices.push(danglingIndex);
                                danglingIndex -= 1;
                            }
                        }
                        network_structure.push(indices);
                    }
                    code += `tn.ncon([`;
                    tensors.forEach(function(tensor) {
                        code += tensor + `,`;
                    });
                    code += `], [`;
                    network_structure.forEach(function(indices) {
                        code += `(`;
                        indices.forEach(function(index) {
                            code += index + `,`;
                        });
                        code += `), `;
                    });
                    code += `])`
                }

                else {
                    for (let i = 0; i < this.state.edges.length; i++) {
                        let edge = this.state.edges[i];
                        let name = this.edgeName(edge);
                        code += `tn.connect(${edge[0][0]}[${edge[0][1]}], ${edge[1][0]}[${edge[1][1]}]${name})\n`;
                    }
                }
                return code;
            },
            highlightedCode: function() {
                return window.hljs.highlight('python', this.outputCode).value;
            }
        },
        methods: {
            placeholderValues: function(node) {
                let code = `np.zeros((`;
                for (let i = 0; i < node.axes.length; i++) {
                    code += `0, `;
                }
                code += `))`;
                return code;
            },
            axisNames: function(node) {
                let code = `, axis_names=[`;
                let willOutput = false;
                for (let i = 0; i < node.axes.length; i++) {
                    let axis = node.axes[i].name;
                    if (axis) {
                        willOutput = true;
                        code += `"${axis}", `
                    }
                    else {
                        code += `None, `
                    }
                }
                code += `]`;
                return willOutput ? code : ``;
            },
            edgeName: function(edge) {
                let name = edge[2];
                return name ? `, name="${name}"` : ``;
            },
            copy: function() {
                let codeText = document.createElement('textarea');
                codeText.value = this.outputCode;
                document.body.appendChild(codeText);
                codeText.select();
                document.execCommand('copy');
                document.body.removeChild(codeText);
                this.copied = true;
                let t = this;
                setTimeout(function() {
                    t.copied = false;
                }, 200);
            }
        },
		template: `
			<div class="code-output">
			    <span>
                    <span class="checkbox-holder">
                        <input type="checkbox" id="checkbox-ncon" v-model="ncon">
                        <label for="checkbox-ncon">Use <code>ncon()</code></label>
                    </span>
                    <button id="copy-button" @click="copy">Copy to clipboard</button>
                </span>
                <pre><code class="hljs" :class="{'copied': copied}" v-html="highlightedCode"></code></pre>
			</div>
		`
	}
);

