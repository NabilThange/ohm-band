// ══════════════════════════════════════════════════════════
//  PIXHAWK 6C FLIGHT CONTROLLER ENCLOSURE — "Aero" Series
//  Modern smooth-shell design with integrated cooling fins,
//  soft-touch dome lid, and engineered snap-fit closure.
//
//  Print:  PETG, 0.2 mm layers, 3 perimeters, 35% gyroid infill
//  Parts:  pixhawk_base() + pixhawk_lid()  (print both, separately)
// ══════════════════════════════════════════════════════════

/* [PCB Dimensions — Pixhawk 6C] */
pcb_l = 84;      // board length (mm)
pcb_w = 44;      // board width (mm)
pcb_h = 20;      // board height incl. tallest connector (mm)

/* [Shell Styling] */
clearance     = 1.5;   // air gap around PCB
wall          = 2.2;   // shell wall thickness
boss_h        = 3;     // standoff height under PCB
corner_r      = 7;     // outer corner roundness (the "modern" look)
top_chamfer   = 3.5;   // how much the lid domes/tapers inward at top
fin_count     = 9;     // cooling fins on the base underside
fin_depth     = 0.8;   // fin relief depth

/* [Snap-Fit] */
snap_h        = 1.6;   // vertical engagement depth of the snap bead
snap_protrude = 0.9;   // how far the bead sticks out
lid_wall      = 2.0;   // lid shell thickness

$fn = 64;

// ── derived dimensions ─────────────────────────────────────
outer_l   = pcb_l + 2*wall + 2*clearance;
outer_w   = pcb_w + 2*wall + 2*clearance;
body_h    = pcb_h + boss_h + wall + clearance;   // base body height (no lid)

// ── helpers ─────────────────────────────────────────────────

// Rounded rectangle footprint, swept to height h, with full corner roundness r
module rounded_box(l, w, h, r) {
    hull() {
        for (x = [r, l-r]) for (y = [r, w-r])
            translate([x, y, 0]) cylinder(r=r, h=h);
    }
}

// Same as rounded_box but the TOP edge also gets a small chamfer/dome,
// giving the part a soft, modern "pebble" silhouette instead of a slab.
module domed_box(l, w, h, r, dome) {
    hull() {
        // base ring
        for (x = [r, l-r]) for (y = [r, w-r])
            translate([x, y, 0]) cylinder(r=r, h=0.01);
        // shrunk top ring, lifted up — creates the inward taper
        for (x = [r, l-r]) for (y = [r, w-r])
            translate([x, y, h]) cylinder(r=max(r-dome,0.5), h=0.01);
    }
}

module m3_boss() {
    difference() {
        cylinder(r=4, h=boss_h);
        cylinder(r=1.75, h=boss_h+1);
    }
}

// A single angled cooling fin groove (modern speaker-grille style)
module fin_groove() {
    rotate([0, 0, 25])
        cube([outer_w*1.4, 1.4, fin_depth*2], center=true);
}

// ══════════════════════════════════════════════════════════
//  BASE SHELL
// ══════════════════════════════════════════════════════════
module pixhawk_base() {
    difference() {
        union() {
            // Main body — straight rounded walls
            rounded_box(outer_l, outer_w, body_h, corner_r);
        }

        // Interior cavity for PCB
        translate([wall, wall, wall + boss_h])
            rounded_box(pcb_l + 2*clearance, pcb_w + 2*clearance,
                        pcb_h + clearance + 2, corner_r - wall);

        // USB-C access port (right side)
        translate([outer_l - wall - 0.5, outer_w/2 - 5, wall + boss_h + 2])
            cube([wall + 1, 10, 6]);

        // TELEM1/2 port cutout (left side)
        translate([-0.5, outer_w/2 - 14, wall + boss_h + 2])
            cube([wall + 1, 28, 8]);

        // GPS/I2C port cutout (rear)
        translate([outer_l/2 - 8, -0.5, wall + boss_h + 2])
            cube([16, wall + 1, 8]);

        // Power module port cutout (front)
        translate([outer_l/2 - 6, outer_w - wall - 0.5, wall + boss_h + 2])
            cube([12, wall + 1, 6]);

        // Modern angled cooling-fin slots on the underside (replaces plain holes)
        for (i = [0:fin_count-1])
            translate([10 + i*((outer_l-20)/fin_count), outer_w/2, 0.3])
                fin_groove();

        // M3 mounting holes in corner flanges, countersunk
        for (x = [9, outer_l - 9]) for (y = [9, outer_w - 9]) {
            translate([x, y, -0.5]) cylinder(r=1.75, h=wall+1);
            translate([x, y, -0.5]) cylinder(r1=3.4, r2=1.75, h=2.2);
        }

        // Snap-fit receiving groove around the inner top rim
        translate([0, 0, body_h - snap_h])
            difference() {
                rounded_box(outer_l + 1, outer_w + 1, snap_h + 0.5, corner_r);
                rounded_box(outer_l - 2*lid_wall + 0.4, outer_w - 2*lid_wall + 0.4,
                            snap_h + 1, max(corner_r - lid_wall, 1));
            }
    }

    // PCB standoff bosses (all 4 corners of the board for stability)
    for (x = [wall + clearance + 4, wall + clearance + pcb_l - 4])
        for (y = [wall + clearance + 4, wall + clearance + pcb_w - 4])
            translate([x, y, wall]) m3_boss();

    // Subtle brand rib detail on the front face (purely aesthetic)
    translate([outer_l/2, -0.3, body_h - 8])
        rotate([90,0,0])
        linear_extrude(0.6)
            for (i=[-1:1])
                translate([i*6,0]) square([2.5, 5], center=true);
}

// ══════════════════════════════════════════════════════════
//  DOMED LID  — soft pebble top with engineered snap bead
// ══════════════════════════════════════════════════════════
module pixhawk_lid() {
    lid_h = 6;
    difference() {
        domed_box(outer_l - 0.4, outer_w - 0.4, lid_h, corner_r, top_chamfer);

        // Recessed label plate (modern minimal nameplate area)
        translate([outer_l/2 - 22, outer_w/2 - 7, lid_h - 0.6])
            linear_extrude(1)
                offset(r=1) square([44, 14], center=false);

        // Hollow underside to save material / weight
        translate([wall, wall, -0.5])
            rounded_box(outer_l - 2*wall - 0.4, outer_w - 2*wall - 0.4, lid_h - 1.4,
                        max(corner_r - wall, 1));
    }

    // Snap-fit bead running around the lid skirt — engages the base groove
    translate([0, 0, -snap_h + 0.2])
        difference() {
            rounded_box(outer_l - 2*lid_wall + 0.2 + snap_protrude*2,
                        outer_w - 2*lid_wall + 0.2 + snap_protrude*2,
                        snap_h, max(corner_r - lid_wall, 1));
            rounded_box(outer_l - 2*lid_wall - 0.2,
                        outer_w - 2*lid_wall - 0.2,
                        snap_h + 1, max(corner_r - lid_wall - 1, 0.5));
        }

    // Lid skirt wall that drops down inside the base opening
    translate([lid_wall, lid_wall, -snap_h])
        difference() {
            rounded_box(outer_l - 2*lid_wall, outer_w - 2*lid_wall, snap_h + 0.2,
                        max(corner_r - lid_wall, 1));
            translate([1, 1, -0.5])
                rounded_box(outer_l - 2*lid_wall - 2, outer_w - 2*lid_wall - 2, snap_h + 1.2,
                            max(corner_r - lid_wall - 1, 0.5));
        }
}

// ── Render layout: base + lid side by side for printing ────
pixhawk_base();
translate([0, outer_w + 12, 0]) pixhawk_lid();
