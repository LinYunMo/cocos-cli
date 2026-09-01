'use strict';

import { Color, Joint2D, Mat4, Vec3 } from 'cc';
import GizmoBase from '../../base/gizmo-base';
import Joint2DController from './controller-joint-2d';

const tempMat4 = new Mat4();

/**
 * 所有 Joint2D 选择 Gizmo 的共享实现。
 *
 * 本阶段只同步并显示 anchor、connectedAnchor；属性写回和 Undo
 * 将在交互阶段接入。
 */
export class Joint2DGizmo<T extends Joint2D = Joint2D> extends GizmoBase<T> {
    protected _anchorController!: Joint2DController;
    protected _connectedAnchorController!: Joint2DController;
    protected readonly _anchorWorldPosition = new Vec3();
    protected readonly _connectedAnchorWorldPosition = new Vec3();
    protected readonly _anchorColor = new Color(16, 180, 245);
    protected readonly _connectedAnchorColor = new Color(207, 105, 40);

    protected init(): void {
        this.createController();
    }

    protected createController(): void {
        const gizmoRoot = this.getGizmoRoot();

        this._anchorController = new Joint2DController(gizmoRoot);
        this._anchorController.editable = true;
        this._anchorController.setColor(this._anchorColor);
        this._anchorController.edit = true;

        this._connectedAnchorController = new Joint2DController(gizmoRoot);
        this._connectedAnchorController.editable = true;
        this._connectedAnchorController.setColor(this._connectedAnchorColor);
        this._connectedAnchorController.edit = true;
    }

    protected onShow(): void {
        this._anchorController.show();
        this._connectedAnchorController.show();
        this.updateControllerData();
    }

    protected onHide(): void {
        this._anchorController.hide();
        this._connectedAnchorController.hide();
    }

    protected updateControllerData(): void {
        if (!this._isInitialized || !this.target) {
            return;
        }
        this.updateAnchorControllerData();
    }

    protected updateAnchorControllerData(): boolean {
        const joint = this.target;
        if (!joint) {
            this._anchorController.hide();
            this._connectedAnchorController.hide();
            return false;
        }

        const node = joint.node;
        const anchor = joint.anchor;
        this._anchorWorldPosition.set(anchor.x, anchor.y, 0);
        node.getWorldMatrix(tempMat4);
        Vec3.transformMat4(this._anchorWorldPosition, this._anchorWorldPosition, tempMat4);
        this._anchorController.updatePosition(node.getWorldPosition(), this._anchorWorldPosition);

        const connectedAnchor = joint.connectedAnchor;
        this._connectedAnchorWorldPosition.set(connectedAnchor.x, connectedAnchor.y, 0);
        const connectedNode = joint.connectedBody?.node;
        if (connectedNode) {
            connectedNode.getWorldMatrix(tempMat4);
            Vec3.transformMat4(this._connectedAnchorWorldPosition, this._connectedAnchorWorldPosition, tempMat4);
            this._connectedAnchorController.updatePosition(
                connectedNode.getWorldPosition(),
                this._connectedAnchorWorldPosition,
            );
        } else {
            this._connectedAnchorController.updatePosition(Vec3.ZERO, this._connectedAnchorWorldPosition);
        }

        this._anchorController.show();
        this._connectedAnchorController.show();
        return true;
    }

    protected onTargetUpdate(): void {
        this.updateControllerData();
    }

    public onNodeChanged(): void {
        this.updateControllerData();
    }

    override destroy(): void {
        super.destroy();
        this._anchorController?.destroy();
        this._connectedAnchorController?.destroy();
    }
}

export default Joint2DGizmo;
