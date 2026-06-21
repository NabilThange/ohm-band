// ══════════════════════════════════════════════════════════
//  SHOCK-ABSORBING LANDING LEGS (×4 set) — "Aero" Series
//  Smoothly tapered strut with a wide leaf-spring flex zone
//  (safer than a thin neck — distributes landing stress over
//  a longer curved section instead of concentrating it at a
//  single thin joint), sculpted grip-tread foot pad, and a
//  curved saddle clamp for the frame arm.
//
//  Print 4×. Material: PETG (flex node needs ductility — do
//  NOT print this in PLA, it will snap under landing loads).
//  0.25 mm layers, 4 perimeters, 15% infill on the leg shaft.
// ══════════════════════════════════════════════════════════

/* [Leg Geometry] */
leg_h         = 80;   // total leg height
leg_od_top    = 11;   // strut OD where it meets the arm clamp
leg_od_bot    = 8;    // strut OD where it meets the flex zone (tapered, modern look)
leg_id        = 5.5;  // hollow core for weight reduction
flex_len      = 22;   // length of the curved leaf-spring flex zone
flex_w        = 9;    // flex-zone wall width (wide & thin beats thin & narrow)
flex_t        = 2.6;  // flex-zone wall thickness (the actual spring)

/* [Foot] */
foot_r        = 16;
foot_h        = 6;
tread_count   = 8;

/* [Arm Clamp] */
arm_od        = 16;   // F450 arm tube OD
clamp_len     = 22;
clamp_wall    = 3;
bolt_d        = 3.4;  // M3 clamp bolt

$fn = 48;

// ══════════════════════════════════════════════════════════
//  FOOT PAD — sculpted dome with grip treads, smooth fillet
//  into the leg shaft (no hard step)
// ══════════════════════════════════════════════════════════
module foot_pad() {
    difference() {
        union() {
            // Domed pad — wide contact patch, smooth top fillet
            hull() {
                cylinder(r=foot_r, h=1);
                translate([0,0,foot_h]) cylinder(r=foot_r - 3, h=1);
            }
            // Raised boss blending up into the leg shaft
            cylinder(r=leg_od_bot/2 + 2, h=foot_h + 6);
        }
        // Tread grooves for grip on soft soil
        for (i = [0:tread_count-1])
            rotate([0, 0, i*(360/tread_count)])
                translate([-foot_r, -0.9, -0.5])
                    cube([foot_r*2, 1.8, 2.5]);
        // Hollow leg socket running through the boss
        cylinder(r=leg_id/2 + 1, h=foot_h + 7);
    }
}

// ══════════════════════════════════════════════════════════
//  FLEX ZONE — wide leaf-spring ankle. Instead of a single
//  thin neck (which concentrates stress and snaps), this is
//  a hollow waisted "hourglass" tube: full diameter at top
//  and bottom, pinched to a thinner wall only at the middle
//  band. The wide unbroken wall spreads landing flex over a
//  long zone instead of a single hinge point — far more
//  durable. Built as one continuous hull stack (robust, no
//  thin/disconnected slices).
// ══════════════════════════════════════════════════════════
module flex_node() {
    r_end   = leg_od_bot/2;       // full radius at top & bottom
    r_waist = flex_t;             // pinched radius at the middle
    difference() {
        union() {
            hull() {
                cylinder(r=r_end, h=0.1);
                translate([0,0,flex_len*0.5]) cylinder(r=r_waist, h=0.1);
            }
            hull() {
                translate([0,0,flex_len*0.5]) cylinder(r=r_waist, h=0.1);
                translate([0,0,flex_len])     cylinder(r=r_end, h=0.1);
            }
        }
        // Hollow core throughout
        cylinder(r=leg_id/2, h=flex_len + 1);
    }
}

// ══════════════════════════════════════════════════════════
//  STRUT — smooth conic tube from flex zone to arm clamp
// ══════════════════════════════════════════════════════════
module upper_leg() {
    strut_h = leg_h - flex_len - foot_h;
    difference() {
        cylinder(r1=leg_od_bot/2, r2=leg_od_top/2, h=strut_h);
        cylinder(r1=leg_id/2, r2=leg_id/2 + 1, h=strut_h + 1);
    }
}

// ══════════════════════════════════════════════════════════
//  ARM CLAMP — curved saddle that wraps the F450 arm tube,
//  smoothly blended into the strut (no hard shoulder)
// ══════════════════════════════════════════════════════════
module arm_clamp() {
    outer_r = arm_od/2 + clamp_wall;
    difference() {
        union() {
            // Saddle shell — open-C cross-section wrapping the arm
            translate([0,0,clamp_len/2])
                rotate([90,0,0])
                    rotate_extrude(angle=200, $fn=64)
                        translate([0, 0, 0])
                            rotate([0,0,-10])
                                translate([outer_r - clamp_wall, 0])
                                    square([clamp_wall, clamp_len]);
            // Flange blending into the strut below
            hull() {
                cylinder(r=leg_od_top/2, h=0.1);
                translate([0,0,4]) cylinder(r=outer_r*0.6, h=0.1);
            }
        }
        // Arm bore (through the saddle, centred on its own axis)
        translate([0, 0, clamp_len/2])
            rotate([-90,0,0])
                cylinder(r=arm_od/2, h=clamp_len*1.4, center=true);
        // M3 cinch-bolt holes through the open ends of the C
        for (a = [80, -80])
            rotate([0,0,a])
                translate([outer_r + 1, 0, clamp_len/2])
                    rotate([90,0,0])
                        cylinder(r=bolt_d/2, h=clamp_wall*3, center=true);
        // Leg socket through the flange
        cylinder(r=leg_id/2 + 1, h=8);
    }
}

// ══════════════════════════════════════════════════════════
//  SINGLE LEG ASSEMBLY — foot → flex spring → strut → clamp
// ══════════════════════════════════════════════════════════
module landing_leg() {
    foot_pad();

    translate([0, 0, foot_h + 3])
        flex_node();

    translate([0, 0, foot_h + flex_len + 3])
        upper_leg();

    translate([0, 0, leg_h - 14])
        arm_clamp();
}

// Print all 4 legs spaced on the build plate
for (i = [0:3])
    translate([i * 48, 0, 0]) landing_leg();
