export {};

const mockRegisterGizmo = jest.fn();
const mockControllerInstances: any[] = [];
const mockGizmoRoot = { name: 'gizmoRoot' };

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

    class MockVec2 {
        constructor(public x = 0, public y = 0) {}
    }

    class MockVec3 {
        static readonly ZERO = new MockVec3();
        static readonly UNIT_Z = new MockVec3(0, 0, 1);

        constructor(public x = 0, public y = 0, public z = 0) {}

        set(value: { x: number; y: number; z?: number }): this;
        set(x: number, y: number, z?: number): this;
        set(valueOrX: number | { x: number; y: number; z?: number }, y?: number, z = 0): this {
            if (typeof valueOrX === 'number') {
                this.x = valueOrX;
                this.y = y ?? 0;
                this.z = z;
            } else {
                this.x = valueOrX.x;
                this.y = valueOrX.y;
                this.z = valueOrX.z ?? 0;
            }
            return this;
        }

        static transformMat4(out: MockVec3, value: MockVec3, matrix: MockMat4): MockVec3 {
            const x = value.x;
            const y = value.y;
            const z = value.z;
            out.x = x * matrix.scaleX + matrix.translateX;
            out.y = y * matrix.scaleY + matrix.translateY;
            out.z = z * matrix.scaleZ + matrix.translateZ;
            return out;
        }
    }

    class MockMat4 {
        translateX = 0;
        translateY = 0;
        translateZ = 0;
        scaleX = 1;
        scaleY = 1;
        scaleZ = 1;
    }

    class MockNode {}
    class MockComponent {
        node!: MockNode;
    }
    class MockJoint2D extends MockComponent {
        anchor = new MockVec2();
        connectedAnchor = new MockVec2();
        connectedBody: { node: MockNode } | null = null;
    }
    class MockDistanceJoint2D extends MockJoint2D {}
    class MockSpringJoint2D extends MockJoint2D {}
    class MockHingeJoint2D extends MockJoint2D {}
    class MockFixedJoint2D extends MockJoint2D {}
    class MockRelativeJoint2D extends MockJoint2D {}
    class MockSliderJoint2D extends MockJoint2D {}
    class MockWheelJoint2D extends MockJoint2D {}
    class MockMouseJoint2D extends MockJoint2D {}

    const classNames = new Map<unknown, string>([
        [MockDistanceJoint2D, 'cc.DistanceJoint2D'],
        [MockSpringJoint2D, 'cc.SpringJoint2D'],
        [MockHingeJoint2D, 'cc.HingeJoint2D'],
        [MockFixedJoint2D, 'cc.FixedJoint2D'],
        [MockRelativeJoint2D, 'cc.RelativeJoint2D'],
        [MockSliderJoint2D, 'cc.SliderJoint2D'],
        [MockWheelJoint2D, 'cc.WheelJoint2D'],
        [MockMouseJoint2D, 'cc.MouseJoint2D'],
    ]);

    return {
        Color: MockColor,
        Component: MockComponent,
        DistanceJoint2D: MockDistanceJoint2D,
        FixedJoint2D: MockFixedJoint2D,
        HingeJoint2D: MockHingeJoint2D,
        Joint2D: MockJoint2D,
        Mat4: MockMat4,
        MouseJoint2D: MockMouseJoint2D,
        Node: MockNode,
        RelativeJoint2D: MockRelativeJoint2D,
        SliderJoint2D: MockSliderJoint2D,
        SpringJoint2D: MockSpringJoint2D,
        Vec2: MockVec2,
        Vec3: MockVec3,
        WheelJoint2D: MockWheelJoint2D,
        js: {
            getClassName: jest.fn((ctor: unknown) => classNames.get(ctor) ?? ''),
        },
    };
});

jest.mock('../scene-process/service/gizmo/gizmo-defines', () => ({
    registerGizmo: (...args: unknown[]) => mockRegisterGizmo(...args),
}));

jest.mock('../scene-process/service/gizmo/base/gizmo-base', () => ({
    __esModule: true,
    default: class MockGizmoBase {
        protected _isInitialized = false;
        private _hidden = true;

        constructor(public target: unknown) {}

        protected getGizmoRoot(): unknown {
            return mockGizmoRoot;
        }

        public show(): void {
            if (!this._isInitialized) {
                (this as any).init?.();
                this._isInitialized = true;
            }
            if (this._hidden) {
                (this as any).onShow?.();
                this._hidden = false;
            }
        }

        public hide(): void {
            if (!this._hidden) {
                (this as any).onHide?.();
                this._hidden = true;
            }
        }

        public destroy(): void {
            this.hide();
            this.target = null;
        }
    },
}));

jest.mock('../scene-process/service/gizmo/components/joint-2d/controller-joint-2d', () => ({
    __esModule: true,
    default: class MockJoint2DController {
        editable = false;
        edit = false;
        show = jest.fn();
        hide = jest.fn();
        setColor = jest.fn();
        updatePosition = jest.fn();
        destroy = jest.fn();

        constructor(public rootNode: unknown) {
            mockControllerInstances.push(this);
        }
    },
}));

const {
    FixedJoint2D,
    HingeJoint2D,
    RelativeJoint2D,
    SliderJoint2D,
    SpringJoint2D,
    Vec2,
    Vec3,
    WheelJoint2D,
} = require('cc');

const distanceModule = require('../scene-process/service/gizmo/components/distance-joint-2d');
const springModule = require('../scene-process/service/gizmo/components/spring-joint-2d');
const hingeModule = require('../scene-process/service/gizmo/components/hinge-joint-2d');
const fixedModule = require('../scene-process/service/gizmo/components/fixed-joint-2d');
const relativeModule = require('../scene-process/service/gizmo/components/relative-joint-2d');
const sliderModule = require('../scene-process/service/gizmo/components/slider-joint-2d');
const wheelModule = require('../scene-process/service/gizmo/components/wheel-joint-2d');

function createNode(
    translateX: number,
    translateY: number,
    scaleX = 1,
    scaleY = 1,
) {
    return {
        getWorldMatrix: jest.fn((out: any) => {
            out.translateX = translateX;
            out.translateY = translateY;
            out.translateZ = 0;
            out.scaleX = scaleX;
            out.scaleY = scaleY;
            out.scaleZ = 1;
            return out;
        }),
        getWorldPosition: jest.fn(() => new Vec3(translateX, translateY, 0)),
    };
}

describe('Joint2D Gizmo', () => {
    beforeEach(() => {
        mockControllerInstances.length = 0;
    });

    it('registers the seven Creator-supported Joint2D component gizmos', () => {
        const modules = [
            ['cc.DistanceJoint2D', distanceModule],
            ['cc.SpringJoint2D', springModule],
            ['cc.HingeJoint2D', hingeModule],
            ['cc.FixedJoint2D', fixedModule],
            ['cc.RelativeJoint2D', relativeModule],
            ['cc.SliderJoint2D', sliderModule],
            ['cc.WheelJoint2D', wheelModule],
        ];

        for (const [name, module] of modules) {
            expect(module.name).toBe(name);
            expect(mockRegisterGizmo).toHaveBeenCalledWith(name, {
                SelectGizmo: module.SelectGizmo,
            });
        }
        expect(mockRegisterGizmo).not.toHaveBeenCalledWith(
            'cc.MouseJoint2D',
            expect.anything(),
        );
    });

    it('shows anchor and connectedAnchor in their owning body world spaces', () => {
        const ownerNode = createNode(10, 20, 2, 3);
        const connectedNode = createNode(-5, 7, 4, 2);
        const target = Object.assign(new SpringJoint2D(), {
            node: ownerNode,
            anchor: new Vec2(1, 2),
            connectedAnchor: new Vec2(3, 4),
            connectedBody: { node: connectedNode },
        });

        const gizmo = new springModule.SelectGizmo(target);
        gizmo.show();

        expect(mockControllerInstances).toHaveLength(2);
        expect(mockControllerInstances[0].rootNode).toBe(mockGizmoRoot);
        expect(mockControllerInstances[0].updatePosition).toHaveBeenLastCalledWith(
            new Vec3(10, 20, 0),
            new Vec3(12, 26, 0),
        );
        expect(mockControllerInstances[1].updatePosition).toHaveBeenLastCalledWith(
            new Vec3(-5, 7, 0),
            new Vec3(7, 15, 0),
        );
    });

    it('treats connectedAnchor as a world position when connectedBody is empty', () => {
        const target = Object.assign(new HingeJoint2D(), {
            node: createNode(10, 20, 2, 3),
            anchor: new Vec2(1, 2),
            connectedAnchor: new Vec2(30, 40),
            connectedBody: null,
        });

        const gizmo = new hingeModule.SelectGizmo(target);
        gizmo.show();

        expect(mockControllerInstances[1].updatePosition).toHaveBeenLastCalledWith(
            Vec3.ZERO,
            new Vec3(30, 40, 0),
        );
    });

    it('refreshes both controllers when the selected Joint node changes', () => {
        const target = Object.assign(new FixedJoint2D(), {
            node: createNode(1, 2),
            anchor: new Vec2(3, 4),
            connectedAnchor: new Vec2(5, 6),
            connectedBody: null,
        });

        const gizmo = new fixedModule.SelectGizmo(target);
        gizmo.show();
        target.anchor = new Vec2(7, 8);
        gizmo.onNodeChanged();

        expect(mockControllerInstances[0].updatePosition).toHaveBeenLastCalledWith(
            new Vec3(1, 2, 0),
            new Vec3(8, 10, 0),
        );
    });

    it('uses the shared base gizmo for all non-distance Joint2D types', () => {
        const cases = [
            [SpringJoint2D, springModule],
            [HingeJoint2D, hingeModule],
            [FixedJoint2D, fixedModule],
            [RelativeJoint2D, relativeModule],
            [SliderJoint2D, sliderModule],
            [WheelJoint2D, wheelModule],
        ];

        for (const [JointCtor, module] of cases) {
            mockControllerInstances.length = 0;
            const target = Object.assign(new JointCtor(), {
                node: createNode(0, 0),
                anchor: new Vec2(),
                connectedAnchor: new Vec2(),
                connectedBody: null,
            });
            new module.SelectGizmo(target).show();
            expect(mockControllerInstances).toHaveLength(2);
        }
    });
});
