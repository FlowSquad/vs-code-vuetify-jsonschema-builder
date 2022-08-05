import * as vscode from 'vscode';
import {getHtmlForWebview} from "./utils";

export class JsonSchemaRendererProvider implements vscode.WebviewViewProvider {

    public static readonly viewType = 'jsonschema-renderer';

    private view?: vscode.WebviewView;
    private state?: JSON;

    constructor(
        private readonly context: vscode.ExtensionContext,
    ) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ): Thenable<void> | void
    {
        this.view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.context.extensionUri, 'media'),
                vscode.Uri.joinPath(this.context.extensionUri, 'dist-vue'),
            ]
        };

        webviewView.webview.html = getHtmlForWebview(webviewView.webview, this.context);

        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                webviewView.webview.postMessage({
                    type: JsonSchemaRendererProvider.viewType + '.updateFromExtension',
                    text: this.state
                });
            }
        });

        webviewView.webview.postMessage({
            type: JsonSchemaRendererProvider.viewType + '.updateFromExtension',
            text: this.state
        });
    }

    public updateRenderer(schema?: JSON): void {
        if (schema) {
            this.state = schema;
        }
        if (this.view) {
            this.view.webview.postMessage({
                type: JsonSchemaRendererProvider.viewType + '.updateFromExtension',
                text: this.state
            });
        }
    }
}