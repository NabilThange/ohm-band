// ══════════════════════════════════════════════════════════
//  ESP32-S3 + RPi CAMERA MODULE 3 NACELLE — "Aero" Series
//  Streamlined sensor pod: rounded nose cowling with lens
//  barrel + sun-visor, smooth shoulder loft into the
//  electronics bay, integrated FPC channel.
//
//  Print:  PETG, 0.2 mm layers, 3 perimeters, 30% infill
//  Mount:  M3 to frame arm via base keel
// ══════════════════════════════════════════════════════════

/* [Component Dimensions] */
esp_l = 27;   esp_w = 25;   esp_h = 10;
cam_l = 25;   cam_w = 24;   cam_h = 11.5;

/* [Styling] */
wall          = 1.8;
cam_tilt_deg  = 10;     // forward-down camera rake angle
fpc_w         = 5.5;    // ribbon cable width
corner_r      = 5;      // body corner roundness
visor_depth   = 5;      // lens sun-visor overhang
visor_thick   = 2.2;

$fn = 64;

// ── derived cell sizes ──────────────────────────────────────
cam_cell_l = cam_l + 2*wall;
cam_cell_w = cam_w + 2*wall;
cam_cell_h = cam_h + wall;

esp_cell_l = esp_l + 2*wall;
esp_cell_w = esp_w + 2*wall;
esp_cell_h = esp_h + wall;

// ── helpers ──────────────────────────────────────────────────
module rounded_box(l, w, h, r) {
    hull() {
        for (x = [r, l-r]) for (y = [r, w-r])
            translate([x, y, 0]) cylinder(r=r, h=h);
    }
}

module fpc_channel() {
    cube([fpc_w + 1, 22, 2.5]);
}

// ══════════════════════════════════════════════════════════
//  CAMERA NOSE — rounded cowling with lens barrel + sun-visor
//  NOTE: the nose/lens faces -Y (outward, away from the ESP
//  bay which sits at +Y). FPC exits toward +Y into the shoulder.
// ══════════════════════════════════════════════════════════
module camera_cell() {
    difference() {
        union() {
            rounded_box(cam_cell_l, cam_cell_w, cam_cell_h, corner_r);

            // Lens barrel boss protruding from the OUTER front face (-Y, modern sensor look)
            translate([cam_cell_l/2, -0.1, cam_cell_h/2 - 1])
                rotate([-90,0,0])
                    cylinder(r=6, h=2.2);

            // Sun-visor lip — sits above the lens boss, cantilevered out over -Y face
            translate([cam_cell_l/2 - 8, -visor_depth + 1.8, cam_cell_h - 4.5])
                cube([16, visor_depth, visor_thick]);
        }

        // Camera cavity
        translate([wall, wall, wall])
            cube([cam_l, cam_w, cam_h + 1]);

        // Lens aperture — drilled straight through the boss and front (-Y) wall
        translate([cam_cell_l/2, -3, cam_cell_h/2 - 1])
            rotate([-90,0,0])
                cylinder(r=4.2, h=10, center=true);

        // FPC exit slot at rear (+Y, toward shoulder/ESP bay), centred
        translate([cam_cell_l/2 - fpc_w/2, cam_cell_w - 2, wall + 1])
            cube([fpc_w, wall + 2, 3]);
    }
}

// ══════════════════════════════════════════════════════════
//  ESP32 BAY — rear electronics housing
// ══════════════════════════════════════════════════════════
module esp32_cell() {
    difference() {
        rounded_box(esp_cell_l, esp_cell_w, esp_cell_h, corner_r);

        // PCB cavity
        translate([wall, wall, wall])
            cube([esp_l, esp_w, esp_h + 1]);

        // USB-C access slot, rear face
        translate([esp_cell_l/2 - 5, esp_cell_w - wall + 0.5, wall + 1])
            cube([10, wall + 1, 5]);

        // FPC entry slot, front face
        translate([esp_cell_l/2 - fpc_w/2, -0.5, wall + 1])
            cube([fpc_w, wall + 1, 3]);

        // M2 mounting holes, countersunk
        for (x = [3.5, esp_cell_l - 3.5]) for (y = [3.5, esp_cell_w - 3.5]) {
            translate([x, y, -0.5]) cylinder(r=1.1, h=wall + 1);
            translate([x, y, esp_cell_h - 1.4]) cylinder(r1=1.1, r2=2.2, h=1.5);
        }

        // Cooling slats on top — angled, modern grille look
        for (i = [0:3])
            translate([7 + i*5, esp_cell_w/2, esp_cell_h - 0.6])
                rotate([0,0,30])
                    cube([2, esp_cell_w*1.3, 1.2], center=true);
    }
}

// ══════════════════════════════════════════════════════════
//  SMOOTH SHOULDER — single clean loft connecting the two
//  bays so the whole pod reads as one continuous form
// ══════════════════════════════════════════════════════════
module shoulder(gap) {
    hull() {
        translate([(cam_cell_l-esp_cell_l)/2, 0, 0])
            rounded_box(esp_cell_l, 0.1, cam_cell_h, corner_r);
        translate([0, gap, 0])
            rounded_box(esp_cell_l, 0.1, esp_cell_h, corner_r);
    }
}

// ══════════════════════════════════════════════════════════
//  FULL NACELLE ASSEMBLY
// ══════════════════════════════════════════════════════════
module nacelle_assembly() {
    shoulder_gap = 16;

    // Camera section, tilted forward-down about its own base centre
    translate([0, 0, 0])
        rotate([cam_tilt_deg, 0, 0])
            camera_cell();

    // Single smooth shoulder loft between the two bays
    translate([(cam_cell_l-esp_cell_l)/2, cam_cell_w, 0])
        shoulder(shoulder_gap);

    // FPC channel bridge, buried inside the shoulder
    translate([cam_cell_l/2 - fpc_w/2, cam_cell_w - 1, 0])
        fpc_channel();

    // ESP32 electronics bay
    translate([(cam_cell_l-esp_cell_l)/2, cam_cell_w + shoulder_gap, 0])
        esp32_cell();

    // Streamlined drone-mount keel — tapered fin under the ESP bay
    keel_x = cam_cell_l/2;
    keel_y = cam_cell_w + shoulder_gap + esp_cell_w/2;
    difference() {
        hull() {
            translate([keel_x, keel_y, 0]) cylinder(r=4, h=0.1);
            translate([keel_x, keel_y, -7]) cylinder(r=2, h=0.1);
        }
        translate([keel_x, keel_y, -7])
            cylinder(r=1.75, h=10, center=true);
    }
}

nacelle_assembly();
