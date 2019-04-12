/********************************************************************************
 * Copyright (C) 2019 Red Hat, Inc. and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { injectable, inject } from 'inversify';
import { Emitter, Event } from '@theia/core';
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';

@injectable()
export class ViewColumnService {
    private panelNode: HTMLElement;
    private viewColumns = new Map<string, number>();
    private viewColumnIds = new Map<number, string[]>();

    constructor(
        @inject(ApplicationShell) private readonly shell: ApplicationShell,
    ) {
        this.panelNode = this.shell.mainPanel.node;

        this.panelNode.addEventListener('p-drop', async () => {
            await new Promise((resolve => setTimeout(() => resolve())));
            this.updateViewColumnIds();
            const viewColumns = new Map<string, number>();
            this.viewColumnIds.forEach((ids: string[], viewColumn: number) => {
                ids.forEach((id: string) => {
                    viewColumns.set(id, viewColumn);
                    if (!this.viewColumns.has(id) || this.viewColumns.get(id) !== viewColumn) {
                        this.onViewColumnChangedEmitter.fire({ id, viewColumn });
                    }
                });
            });
            this.viewColumns = viewColumns;
        }, true);
    }

    updateViewColumnIds(): void {
        const dockPanelElements = this.panelNode.getElementsByClassName('p-DockPanel-widget');
        const positionIds = new Map<number, string[]>();
        for (let i = 0; i < dockPanelElements.length; i++) {
            // tslint:disable-next-line:no-any
            const dockPanel = <any>dockPanelElements[i];
            if (dockPanel && dockPanel.style && dockPanel.style.left) {
                const pos = parseInt(dockPanel.style.left);
                if (!positionIds.has(pos)) {
                    positionIds.set(pos, []);
                }
                positionIds.get(pos)!.push(dockPanelElements[i].id);
            }
        }
        this.viewColumnIds.clear();
        [...positionIds.keys()].sort().forEach((key: number, viewColumn: number) => {
            positionIds.get(key)!.forEach((id: string) => {
                if (!this.viewColumnIds.has(viewColumn)) {
                    this.viewColumnIds.set(viewColumn, []);
                }
                this.viewColumnIds.get(viewColumn)!.push(id);
            });
        });
    }

    getViewColumnIds(viewColumn: number): string[] {
        return this.viewColumnIds.get(viewColumn) || [];
    }

    protected readonly onViewColumnChangedEmitter = new Emitter<{ id: string, viewColumn: number }>();
    get onViewColumnChanged(): Event<{ id: string, viewColumn: number }> {
        return this.onViewColumnChangedEmitter.event;
    }
}
