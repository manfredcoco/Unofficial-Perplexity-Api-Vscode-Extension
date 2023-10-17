const vscode = require('vscode');
const fetch = require('node-fetch');

class MyTreeDataProvider {
  constructor() {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.data = [];
  }

  getTreeItem(element) {
    return element;
  }

  getChildren(element) {
    if (!this.data) {
      return Promise.resolve([]);
    }

    return Promise.resolve(this.data);
  }

  addData(data) {
    const treeItem = new vscode.TreeItem(data);
    this.data.push(treeItem);
    this._onDidChangeTreeData.fire();
  }
}

function activate(context) {
  console.log('Extension activated');

  const treeDataProvider = new MyTreeDataProvider();
  vscode.window.registerTreeDataProvider('myView', treeDataProvider);

  // Create status bar item
  const myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
  myStatusBarItem.text = "$(rocket)";
  myStatusBarItem.command = "extension.showInputBox";
  myStatusBarItem.show();

  // Register command to show input box
  context.subscriptions.push(vscode.commands.registerCommand('extension.showInputBox', function () {
    vscode.window.showInputBox().then(value => {
      if (!value) return;

      // Add input message to tree view
      treeDataProvider.addData(value);

      // Make POST request to external API
      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: 'Bearer _Your-API-Token-Here_' // replace with your new token
        },
        body: JSON.stringify({
          model: 'mistral-7b-instruct',
          messages: [
            {role: 'system', content: 'Be precise and concise.'},
            {role: 'user', content: value}
          ]
        })
      };

      fetch('https://api.perplexity.ai/chat/completions', options)
        .then(response => {
          if (!response.ok) {
            return response.text().then(text => {
              throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
            });
          }
          return response.json();
        })
        .then(response => {
          console.log(response);
          // Add API response to tree view
          if (response && response.choices && response.choices[0] && response.choices[0].message) {
            treeDataProvider.addData(response.choices[0].message.content);
          }
        })
        .catch(err => console.error(err));
    });
  }));

  // Register command to copy tree item
  context.subscriptions.push(vscode.commands.registerCommand('extension.copyTreeItem', function (item) {
    vscode.env.clipboard.writeText(item.label);
  }));

  // Add disposable for status bar item
  context.subscriptions.push(myStatusBarItem);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
}
