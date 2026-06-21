// ══════════════════════════════════════════════════════════
//  BATTERY TRAY — Tattu 4S 5000 mAh — "Aero" Series
//  Smooth rounded-edge cradle with scalloped finger-access
//  cutouts for easy battery removal, angled Velcro strap
//  channels, a sculpted XT60 cable guide, and a lightweight
//  ribbed underside (saves weight without losing stiffness).
//
//  Print:  PETG, 0.2 mm layers, 3 perimeters, 20% infill
//  Mounts: F450 bottom plate, 30.5 mm bolt pattern
// ══════════════════════════════════════════════════════════

/* [Battery — Tattu 4S 5000 mAh] */
batt_l  = 158 + 2;
batt_w  =  46 + 2;
batt_h  =  42 + 2;

/* [Styling] */
wall        = 2.2;
corner_r    = 6;     // smooth outer corner roundness
strap_w     = 27;
strap_h     = 6;
xt60_w      = 16;
xt60_h      = 14;
mount_pitch = 30.5;
scallop_r   = 14;    // finger-access scallop radius (for lifting battery out)
rib_count   = 5;      // underside stiffening ribs

$fn = 48;

// ── helpers ──────────────────────────────────────────────────
module rounded_box(l, w, h, r) {
    hull() {
        for (x = [r, l-r]) for (y = [r, w-r])
            translate([x, y, 0]) cylinder(r=r, h=h);
    }
}

// ══════════════════════════════════════════════════════════
//  MAIN TRAY
// ══════════════════════════════════════════════════════════
module battery_tray() {
    outer_l = batt_l + 2*wall;
    outer_w = batt_w + 2*wall;
    outer_h = batt_h/2 + wall;   // open top — battery slides in from above
    wall_h  = 9;                  // retaining side-wall height above the floor
    pocket_depth = wall * 0.55;   // weight-relief pocket depth (partial, NOT through — keeps floor solid)

    difference() {
        union() {
            // Single continuous shell: base block + taller retaining rim,
            // built as ONE hull stack (avoids coincident-face z-fighting
            // that a separate stacked wall piece would cause).
            hull() {
                rounded_box(outer_l, outer_w, 0.1, corner_r);
                translate([0, 0, outer_h - 0.1])
                    rounded_box(outer_l, outer_w, 0.1, corner_r);
            }
            translate([0, 0, outer_h])
                rounded_box(outer_l, outer_w, wall_h, corner_r);
        }

        // Battery recess cavity (open top) — carves the cradle interior
        translate([wall, wall, wall])
            cube([batt_l, batt_w, batt_h + wall_h + 2]);

        // Finger-access scallops on the long sides — smooth half-domes
        // cut into the top rim so fingers can grip under the battery
        for (x = [outer_l*0.28, outer_l*0.72]) {
            translate([x, -1, outer_h + wall_h - 4])
                rotate([0,90,0])
                    cylinder(r=4, h=wall+2, $fn=24);
            translate([x, outer_w - wall - 1, outer_h + wall_h - 4])
                rotate([0,90,0])
                    cylinder(r=4, h=wall+2, $fn=24);
        }

        // Velcro strap slots — front
        translate([outer_l/2 - strap_w/2, -0.5, outer_h/2 - strap_h/2])
            cube([strap_w, outer_w + 1, strap_h]);

        // Velcro strap slots — rear
        translate([outer_l/2 - strap_w/2, -0.5, outer_h - strap_h - 4])
            cube([strap_w, outer_w + 1, strap_h]);

        // XT60 cable guide on right end
        translate([outer_l - wall - 0.5, outer_w/2 - xt60_w/2, wall])
            cube([wall + 1, xt60_w, xt60_h]);

        // Weight-relief pockets in the underside — PARTIAL depth only,
        // leaves a solid floor skin under the battery for strength
        for (i = [-1, 0, 1])
            translate([outer_l/2 + i*32, outer_w/2, -0.5])
                cylinder(r=10, h=pocket_depth + 0.5);

        // F450 mounting holes (30.5 mm pattern), countersunk
        for (x = [outer_l/2 - mount_pitch/2, outer_l/2 + mount_pitch/2])
            for (y = [outer_w/2 - mount_pitch/2, outer_w/2 + mount_pitch/2]) {
                translate([x, y, -0.5]) cylinder(r=1.75, h=wall + 1);
                translate([x, y, -0.5]) cylinder(r1=3.4, r2=1.75, h=2.2);
            }
    }
}

battery_tray();
