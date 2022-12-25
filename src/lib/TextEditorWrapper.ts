import * as vscode from "vscode";
import {TextDocument, TextEditor} from "vscode";
import {Updatable} from "./types";


export enum TextEditorShowOption {
    'Tab' = 'Tab',
    'Group' = 'Group'
}

export abstract class TextEditorWrapper implements Updatable<TextDocument> {

    protected abstract showOption: TextEditorShowOption;
    private _textEditor: TextEditor | undefined;
    private isOpen = false;

    private get textEditor(): TextEditor {
        if (this._textEditor) {
            return this._textEditor;
        } else {
            throw new Error('[TextEditor] TextEditor is not initialized!');
        }
    }

    public toggle(document: TextDocument): void {
        try {
            if (this.isOpen) {
                this.close(document.fileName);
            } else {
                this.create(document);
            }
        } catch (error) {
            console.error('', error);
        }
    }

    public async create(document: TextDocument): Promise<boolean> {
        try {
            if (!this.isOpen) {
                this._textEditor = await vscode.window.showTextDocument(document, this.getShowOptions())
                    .then((textEditor) => {
                        this.isOpen = true;
                        return textEditor;
                    }, (reason) => {
                        throw new Error(reason);
                    });
            }

            return Promise.resolve(true);

        } catch (error) {
            return Promise.reject('[TextEditor]' + error);
        }
    }

    public async close(fileName: string): Promise<boolean> {
        if (!this.isOpen) {
            return Promise.resolve(true);
        }

        try {
            const tab = this.getTab(fileName);
            return Promise.resolve(vscode.window.tabGroups.close(tab)
                .then((result) => {
                    this.isOpen = false;
                    return result;
                }, (reason) => {
                    throw new Error(reason);
                }));

        } catch (error) {
            return Promise.reject('[TextEditor]' + error);
        }
    }

    public async update(document: TextDocument): Promise<boolean> {
        try {
            if (this.isOpen && this.textEditor.document.uri.toString() !== document.uri.toString()) {
                if (await this.close(this.textEditor.document.fileName)) {
                    return Promise.resolve(this.create(document));
                }
            }

            return Promise.resolve(true);

        } catch (error) {
            return Promise.reject('[TextEditor]' + error);
        }
    }

    private getShowOptions(): vscode.TextDocumentShowOptions {
        switch (this.showOption) {
            case 'Group': {
                return {
                    preserveFocus: false,
                    preview: true,
                    viewColumn: vscode.ViewColumn.Beside
                };
            }
            case 'Tab': {
                return {
                    preserveFocus: true,
                    preview: false,
                    viewColumn: vscode.ViewColumn.Active
                };
            }
            default: {
                return {};
            }
        }
    }

    private getTab(fileName: string): vscode.Tab {
        for (const tabGroup of vscode.window.tabGroups.all) {
            for (const tab of tabGroup.tabs) {
                if (tab.input instanceof vscode.TabInputText &&
                    tab.input.uri.path === fileName) {

                    return tab;
                }
            }
        }
        throw new Error('[TextEditor] Tab could not be found!');
    }
}