var SPI = require("spi-device");
var Gpio = require("onoff").Gpio;
var spi = SPI.openSync(0, 0, {mode: 0, maxSpeedHz: 180000});
var reset = new Gpio(17, "out");

function readReg(reg) {
  var tx = Buffer.from([1, reg, 0]);
  var rx = Buffer.alloc(3);
  spi.transferSync([{sendBuffer: tx, receiveBuffer: rx, byteLength: 3, speedHz: 180000}]);
  return rx[2];
}
function writeReg(reg, val) {
  var tx = Buffer.from([0, reg, val]);
  spi.transferSync([{sendBuffer: tx, byteLength: 3, speedHz: 180000}]);
}

console.log("=== Resetting OS8104A ===");
reset.writeSync(0);
setTimeout(function() {
  reset.writeSync(1);
  console.log("Reset complete, initializing...");
  
  setTimeout(function() {
    // Init sequence
    writeReg(0x85, 0x0f); // Clear ints
    writeReg(0x8a, 0x01); // NAH
    writeReg(0x8b, 0x10); // NAL  
    writeReg(0x89, 0x22); // GA
    writeReg(0x83, 0x06); // CM1: PLL enable + crystal
    writeReg(0x92, 0x16); // CM3: FREN + AUTO_CRYSTAL + FREQ_REG_RESET
    writeReg(0x80, 0xc3); // XCR: Master + output enable
    writeReg(0x82, 0xd3); // SDC1
    writeReg(0x8c, 0x40); // SDC2: SCK 32F
    writeReg(0x81, 0x50); // XSR
    writeReg(0x88, 0x07); // IE
    console.log("Registers written, waiting for PLL lock...");
    
    setTimeout(function() {
      var cm2 = readReg(0x84);
      var locked = (cm2 & 2) ? "NO" : "YES";
      console.log("PLL Locked: " + locked + " (CM2=0x" + cm2.toString(16) + ")");
      
      if (locked === "YES") {
        console.log("=== MOST Network Active! ===");
        console.log("Node Address: 0x" + readReg(0x8a).toString(16) + readReg(0x8b).toString(16));
        console.log("XCR: 0x" + readReg(0x80).toString(16));
        console.log("XSR: 0x" + readReg(0x81).toString(16));
        
        // Send a test control message to ourselves
        console.log("\n=== Sending loopback test message ===");
        writeReg(0x85, 0x0f); // clear ints
        // Write to TX buffer
        writeReg(0xc0, 0x01); // Target high
        writeReg(0xc1, 0x10); // Target low (our address)
        writeReg(0xc2, 0x01); // FBlockID
        writeReg(0xc3, 0x00); // InstanceID
        writeReg(0xc4, 0x00); // FktID high
        writeReg(0xc5, 0x00); // FktID low + OpType
        writeReg(0xc6, 0x01); // TelLen
        writeReg(0xc7, 0x42); // Data: 0x42
        writeReg(0x85, 0x02); // Trigger TX
        
        setTimeout(function() {
          var msgStatus = readReg(0x85);
          console.log("MSG Status: 0x" + msgStatus.toString(16));
          console.log("Loopback test complete!");
          reset.unexport();
          spi.closeSync();
        }, 500);
      } else {
        console.log("PLL lock failed");
        reset.unexport();
        spi.closeSync();
      }
    }, 2000);
  }, 100);
}, 200);
