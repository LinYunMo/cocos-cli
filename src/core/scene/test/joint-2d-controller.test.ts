export {};

const mockCreatedShapeNodes: any[] = [];
const mockCalcDiscData = jest.fn((center: unknown, normal: unknown, radius: number) => ({
    kind: 'disc', center, normal, radius,
}));
const mockCalcCircleData = jest.fn((center: unknown, normal: unknown, radius: number) => ({
    kind: 'circle', center, normal, radius,
}));
const mockCalcLineData = jest.fn((start: unknown, end: unknown) => ({
    kind: 'line',
    positions: [start, end],
    minPos: start,
    maxPos: end,
}));
const mockSetMeshColor = jest.fn();
const mockSetNodeOpacity = jest.fn();
const mockUpdateBoundingBox = jest.fn();
const mockUpdatePositions = jest.fn();
const mockUpdateVBAttr = jest.fn();

jest.mock('cc', () => {
    class MockColor {
        static readonly BLUE = new MockColor(0, 0, 255, 255);
        static readonly YELLOW = new MockColor(255, 255, 0, 255);

        constructor(
            public r = 0,
            public g = 0,
            public b = 0,
            public a = 255,
        ) {}
    }

    class MockVec3 {
        static readonly ZERO = new MockVec3();
        static readonly UNIT_Z = new MockVec3(0, 0, 1);

        constructor(public x = 0, public y = 0, public z = 0) {}

        set(value: { x: number; y: number; z: number }): this {
            this.x = value.x;
            this.y = value.y;
            this.z = value.z;
            return this;
        }

        static multiply(out: MockVec3, lhs: MockVec3, rhs: MockVec3): MockVec3 {
            out.x = lhs.x * rhs.x;
            out.y = lhs.y * rhs.y;
            out.z = lhs.z * rhs.z;
            return out;
        }

        static distance(lhs: MockVec3, rhs: MockVec3): number {
            return Math.hypot(lhs.x - rhs.x, lhs.y - rhs.y, lhs.z - rhs.z);
        }
    }

    class MockNode {
        name = '';
        parent: unknown = null;
        renderer = {};
        destroy = jest.fn();
        setPosition = jest.fn();
        setScale = jest.fn();
    }

    class MockMeshRenderer {}

    return {
        Color: MockColor,
        MeshRenderer: MockMeshRenderer,
        Node: MockNode,
        Vec3: MockVec3,
    };
});

jest.mock('../scene-process/service/gizmo/controller/editable', () => {
    const { Color, Node, Vec3 } = require('cc');

    return {
        __esModule: true,
        default: class MockEditableController {
            public shape: any;
            public editable = false;
            protected _rootNode: unknown;
            protected _color = Color.BLUE;
            protected _hoverColor = Color.YELLOW;
            protected _editHandleColor = Color.BLUE;
            protected _editHandleKeys: string[] = [];
            protected _editHandleScales: Record<string, number> = {};
            protected _handleDataMap: Record<string, any> = {};
            protected _editHandlesShape: any = null;
            private _edit = false;
            private readonly _scale = new Vec3(1, 1, 1);

            public adjustControllerSize = jest.fn();
            public unregisterEvents = jest.fn();

            constructor(rootNode: unknown) {
                this._rootNode = rootNode;
            }

            get edit(): boolean {
                return this._edit;
            }

            set edit(value: boolean) {
                this._edit = value;
                if (!value || this._editHandlesShape) {
                    return;
                }
                this._editHandlesShape = new Node();
                this._editHandlesShape.parent = this._rootNode;
                for (const key of this._editHandleKeys) {
                    (this as any).createEditHandle(key, this._editHandleColor);
                }
            }

            public createShapeNode(name: string): void {
                this.shape = new Node();
                this.shape.name = name;
                this.shape.parent = this._rootNode;
            }

            public setEditHandlesColor(color: unknown): void {
                this._editHandleColor = color;
            }

            public initHandle(node: any, handleName: string): any {
                const data = { name: handleName, topNode: node };
                this._handleDataMap[handleName] = data;
                return data;
            }

            public getScale(): any {
                return this._scale;
            }

            public updateEditHandles(): void {
                for (const key of this._editHandleKeys) {
                    (this as any)._updateEditHandle(key);
                }
            }
        },
    };
});

jest.mock('../scene-process/service/gizmo/utils/controller-utils', () => {
    const { Node } = require('cc');
    return {
        __esModule: true,
        default: {
            createShapeByData: jest.fn(() => {
                const node = new Node();
                mockCreatedShapeNodes.push(node);
                return node;
            }),
        },
    };
});

jest.mock('../scene-process/service/gizmo/utils/controller-shape', () => ({
    __esModule: true,
    default: {
        calcDiscData: (center: unknown, normal: unknown, radius: number) => mockCalcDiscData(center, normal, radius),
        calcCircleData: (center: unknown, normal: unknown, radius: number) => mockCalcCircleData(center, normal, radius),
        calcLineData: (start: unknown, end: unknown) => mockCalcLineData(start, end),
    },
}));

jest.mock('../scene-process/service/gizmo/utils/engine-utils', () => ({
    getModel: jest.fn((node: any) => node.renderer),
    setMeshColor: (...args: unknown[]) => mockSetMeshColor(...args),
    setNodeOpacity: (...args: unknown[]) => mockSetNodeOpacity(...args),
    updateBoundingBox: (...args: unknown[]) => mockUpdateBoundingBox(...args),
    updatePositions: (...args: unknown[]) => mockUpdatePositions(...args),
    updateVBAttr: (...args: unknown[]) => mockUpdateVBAttr(...args),
}));

const { Color, Vec3 } = require('cc');
const Joint2DController = require('../scene-process/service/gizmo/components/joint-2d/controller-joint-2d').default;

describe('Joint2DController static rendering', () => {
    beforeEach(() => {
        mockCreatedShapeNodes.length = 0;
        mockCalcDiscData.mockClear();
        mockCalcCircleData.mockClear();
        mockCalcLineData.mockClear();
        mockSetMeshColor.mockClear();
        mockSetNodeOpacity.mockClear();
        mockUpdateBoundingBox.mockClear();
        mockUpdatePositions.mockClear();
        mockUpdateVBAttr.mockClear();
    });

    it('creates a dashed center line and a compound circular anchor handle', () => {
        const controller = new Joint2DController({ name: 'gizmoRoot' });
        controller.editable = true;
        controller.setColor(new Color(16, 180, 245));
        controller.edit = true;

        expect(mockCalcLineData).toHaveBeenCalledTimes(1);
        expect(mockCalcDiscData).toHaveBeenCalledTimes(2);
        expect(mockCalcCircleData).toHaveBeenCalledTimes(1);
        expect(mockSetNodeOpacity).toHaveBeenCalledWith(mockCreatedShapeNodes[1], 80);
    });

    it('updates line geometry, dash distance, bounds and handle position', () => {
        const controller = new Joint2DController({ name: 'gizmoRoot' });
        controller.editable = true;
        controller.edit = true;
        const center = new Vec3(1, 2, 0);
        const anchor = new Vec3(4, 6, 0);

        controller.updatePosition(center, anchor);

        const lineRenderer = mockCreatedShapeNodes[0].renderer;
        expect(mockUpdateVBAttr).toHaveBeenCalledWith(lineRenderer, 'a_lineDistance', [0, 5]);
        expect(mockUpdatePositions).toHaveBeenCalledWith(lineRenderer, expect.any(Array));
        expect(mockUpdateBoundingBox).toHaveBeenCalledWith(lineRenderer, center, anchor);
        expect(mockCreatedShapeNodes[1].setPosition).toHaveBeenCalledWith(new Vec3(4, 6, 0));
        expect(controller.adjustControllerSize).toHaveBeenCalledTimes(1);
    });

    it('destroys both render roots after the gizmo is released', () => {
        const controller = new Joint2DController({ name: 'gizmoRoot' });
        controller.editable = true;
        controller.edit = true;
        const shape = controller.shape;
        const editShape = (controller as any)._editHandlesShape;

        controller.destroy();

        expect(controller.unregisterEvents).toHaveBeenCalledTimes(1);
        expect(shape.destroy).toHaveBeenCalledTimes(1);
        expect(editShape.destroy).toHaveBeenCalledTimes(1);
    });
});
