'use strict';

import { DistanceJoint2D, js } from 'cc';
import { registerGizmo } from '../../gizmo-defines';
import { SelectGizmo as Joint2DGizmo } from '../joint-2d';

class DistanceJoint2DGizmo extends Joint2DGizmo<DistanceJoint2D> {}

export const name = js.getClassName(DistanceJoint2D);
export const SelectGizmo = DistanceJoint2DGizmo;
export const IconGizmo = null;
export const PersistentGizmo = null;

registerGizmo(name, { SelectGizmo });
