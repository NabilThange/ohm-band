// ══════════════════════════════════════════════════════════
//  GPS MAST MOUNT — u-blox M9N — "Aero" Series
//  Tapered antenna stalk (thick base, slim neck), finned
//  stabiliser base, and a streamlined low-profile GPS puck
//  head instead of a flat disc.
//
//  Print:  PETG/PLA, 0.2 mm layers, 20% infill, 4 perimeters
//  Mounts: F450-pattern base, 30.5 mm bolt spacing
// ══════════════════════════════════════════════════════════

/* [Mast] */
mast_h        = 60;   // elevation above frame
mast_od_base  = 13;   // mast outer diameter at the base (thick)
mast_od_top   = 9;    // mast outer diameter at the top (slim neck)
mast_id       = 7;    // hollow core for cable routing

/* [GPS Head] */
gps_od        = 36;   // u-blox M9N module diameter
gps_h         = 8;
puck_taper    = 3;    // how much the puck dome tapers inward at the rim

/* [Base] */
base_d        = 42;
base_h        = 7;
fin_count     = 6;    // stabiliser fins around the base
fin_h         = 9;
mount_pitch   = 30.5; // F450 bottom-plate bolt pitch

$fn = 72;

// ══════════════════════════════════════════════════════════
//  TAPERED MAST — smooth conic stalk, hollow for wiring
// ══════════════════════════════════════════════════════════
module mast() {
    difference() {
        cylinder(r1=mast_od_base/2, r2=mast_od_top/2, h=mast_h);
        // Hollow core for cable routing
        cylinder(r=mast_id/2, h=mast_h + 1);
        // JST-GH cable exit slot at base
        translate([-3, -mast_od_base/2 - 0.5, 5])
            cube([6, mast_od_base + 1, 8]);
    }
}

// ══════════════════════════════════════════════════════════
//  GPS HEAD — low-profile domed puck with retaining rim
// ══════════════════════════════════════════════════════════
module gps_head() {
    difference() {
        union() {
            // Domed puck body — smooth taper from base ring to flat top
            hull() {
                cylinder(r=gps_od/2 + 2, h=0.1);
                translate([0,0,gps_h])
                    cylinder(r=gps_od/2 + 2 - puck_taper, h=0.1);
            }
            // Retaining rim lip
            cylinder(r=gps_od/2, h=gps_h + 1.5);
        }
        // Module cavity
        translate([0, 0, 3])
            cylinder(r=gps_od/2 - 0.5, h=gps_h + 1);
        // Cable pass-through to mast
        cylinder(r=mast_id/2, h=gps_h + 4);
        // Two M2 retention screws
        for (a = [45, 225])
            rotate([0, 0, a])
                translate([gps_od/2 - 2, 0, -0.5])
                    cylinder(r=1.2, h=gps_h + 4);
    }
}

// ══════════════════════════════════════════════════════════
//  STABILISER BASE — finned conic foot, modern turbine look
// ══════════════════════════════════════════════════════════
module base_plate() {
    difference() {
        union() {
            // Smooth domed base — tapers from wide foot to mast root
            hull() {
                cylinder(r=base_d/2, h=0.1);
                translate([0,0,base_h])
                    cylinder(r=mast_od_base/2 + 1, h=0.1);
            }
            // Radial rib details embossed on the cone surface (turbine-blade look)
            for (i = [0:fin_count-1])
                rotate([0,0, i*(360/fin_count)])
                    hull() {
                        translate([mast_od_base/2 + 1, 0, base_h - 0.5])
                            cylinder(r=0.9, h=0.6);
                        translate([base_d/2 - 4, 0, 0.5])
                            cylinder(r=0.9, h=0.6);
                    }
        }
        // M3 clearance holes on 30.5 mm pattern
        for (x = [-mount_pitch/2, mount_pitch/2]) for (y = [-mount_pitch/2, mount_pitch/2])
            translate([x, y, -0.5]) cylinder(r=1.75, h=base_h + 1);
        // M3 countersink
        for (x = [-mount_pitch/2, mount_pitch/2]) for (y = [-mount_pitch/2, mount_pitch/2])
            translate([x, y, base_h - 2]) cylinder(r1=1.75, r2=3.5, h=2.5);
        // Cable pass-through to mast core
        cylinder(r=mast_id/2, h=base_h + 1);
    }
}

// ══════════════════════════════════════════════════════════
//  FULL ASSEMBLY
// ══════════════════════════════════════════════════════════
base_plate();
translate([0, 0, base_h]) mast();
translate([0, 0, base_h + mast_h]) gps_head();
