'use strict';

import { Color, MeshRenderer, Node, Vec3 } from 'cc';
import EditableController from '../../controller/editable';
import ControllerUtils from '../../utils/controller-utils';
import ControllerShape from '../../utils/controller-shape';
import {
    getModel,
    setMeshColor,
    setNodeOpacity,
    updateBoundingBox,
    updatePositions,
    updateVBAttr,
} from '../../utils/engine-utils';

const tempVec3 = new Vec3();

/**
 * Joint2D 的通用可视化控制器。
 *
 * 当前阶段只负责绘制锚点 Handle 与刚体中心到锚点的虚线；
 * 拖动平面和鼠标交互将在后续交互阶段接入。
 */
export class Joint2DController extends EditableController {
    private _lineNode: Node | null = null;
    private _lineRenderer: MeshRenderer | null = null;
    private readonly _anchor = new Vec3();
    private readonly _center = new Vec3();

    constructor(rootNode: Node) {
        super(rootNode);
        this._editHandleColor = Color.BLUE;
        this._hoverColor = Color.YELLOW;
        this._editHandleKeys = ['Head'];
        this.initShape();
    }

    public setColor(color: Color): void {
        this.setEditHandlesColor(color);
        if (this._lineNode) {
            setMeshColor(this._lineNode, color);
        }
    }

    override createEditHandle(handleName: string, color: Color) {
        const editHandleNode = this.createHeadNode(handleName, color);
        setNodeOpacity(editHandleNode, 80);
        editHandleNode.parent = this._editHandlesShape;
        this._editHandleScales[handleName] = 1;
        return this.initHandle(editHandleNode, handleName);
    }

    private createHeadNode(name: string, color: Color): Node {
        const headData = ControllerShape.calcDiscData(Vec3.ZERO, Vec3.UNIT_Z, 10);
        const headNode = ControllerUtils.createShapeByData(headData, color, { unlit: true });
        headNode.name = name;

        const circleData = ControllerShape.calcCircleData(Vec3.ZERO, Vec3.UNIT_Z, 10);
        const circleNode = ControllerUtils.createShapeByData(circleData, color, { unlit: true });
        circleNode.parent = headNode;

        const centerDiscData = ControllerShape.calcDiscData(Vec3.ZERO, Vec3.UNIT_Z, 3);
        const centerDiscNode = ControllerUtils.createShapeByData(centerDiscData, color, { unlit: true });
        centerDiscNode.parent = headNode;

        return headNode;
    }

    private initShape(): void {
        this.createShapeNode('Joint2DController');

        const lineData = ControllerShape.calcLineData(this._center, this._anchor);
        this._lineNode = ControllerUtils.createShapeByData(lineData, this._color, {
            unlit: true,
            dashed: true,
        });
        this._lineNode.name = 'JointLine';
        this._lineNode.parent = this.shape;
        this._lineRenderer = getModel(this._lineNode);
    }

    override _updateEditHandle(handleName: string): void {
        const handleData = this._handleDataMap[handleName];
        if (!handleData) {
            return;
        }

        const node = handleData.topNode;
        const baseScale = this._editHandleScales[handleName];
        const scale = this.getScale();
        node.setScale(baseScale / scale.x, baseScale / scale.y, baseScale / scale.z);
        Vec3.multiply(tempVec3, this._anchor, scale);
        node.setPosition(tempVec3);
    }

    public updatePosition(center: Readonly<Vec3>, anchor: Readonly<Vec3>): void {
        this._center.set(center);
        this._anchor.set(anchor);

        if (this._lineRenderer) {
            const lineData = ControllerShape.calcLineData(this._center, this._anchor);
            updateVBAttr(this._lineRenderer, 'a_lineDistance', [0, Vec3.distance(this._center, this._anchor)]);
            updatePositions(this._lineRenderer, lineData.positions);
            updateBoundingBox(this._lineRenderer, lineData.minPos, lineData.maxPos);
        }

        if (this.edit) {
            this.updateEditHandles();
        }
        this.adjustControllerSize();
    }

    public destroy(): void {
        this.unregisterEvents();
        this._editHandlesShape?.destroy();
        this._editHandlesShape = null;
        this.shape?.destroy();
        this._lineNode = null;
        this._lineRenderer = null;
    }
}

export default Joint2DController;
