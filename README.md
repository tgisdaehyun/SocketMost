# SocketMost (Fork)

> Forked from [rhysmorgan134/SocketMost](https://github.com/rhysmorgan134/SocketMost)

## Changes in this fork

### `feature/rpi5-gpio-and-loopback` branch

- **RPi4 kernel 6.6+ GPIO support**: Auto-detect GPIO base offset (512) for newer kernels where `gpiochip0` starts at 512 instead of 0
- **Master/TimingMaster mode**: Add `"master": true` option in `config.json` for standalone/loopback operation with crystal clock source
- **Loopback test script**: `loopback_test.js` for standalone transceiver verification without a MOST network
- **Increased reset timing**: Longer wait after chip reset for reliable initialization

### Master mode usage

To run as MOST TimingMaster (e.g., for loopback testing):

```json
{
  "version": "1.0.0",
  "nodeAddress": 272,
  "groupAddress": 34,
  "freq": 48,
  "mostExplorer": true,
  "master": true
}
```

### Loopback test

Connect TX fiber to RX (loopback cable), then:

```shell
cd SocketMost
sudo node loopback_test.js
```

Expected output:
```
=== Resetting OS8104A ===
Reset complete, initializing...
Registers written, waiting for PLL lock...
PLL Locked: YES (CM2=0x1)
=== MOST Network Active! ===
```

---

# Original README

## SocketMost for use with [PiMost](https://shop.moderndaymods.com/products/pimost-hat-usb-c-power-most25-only)

***

### PiMost header info https://github.com/rhysmorgan134/SocketMost/wiki/PiMost

This is a library for use with the PiMost to allow Most Bus messages (Most 25 only) to be sent to various applications. This
package just gives out a json formatted string over a unix Datagram socket that can then be consumed through 
which ever application you wish. The implementation is currently at a very early stage, and has been tested
on a Jaguar and Land rover system running at 48khz. In theory 44.1khz should be useable but will need some configuration
changes around the registers (as a hint look into legacy start up mode, and only using the RX from the transceiver as the locking source) this is 
untested and no guarantee it will work in the way highlighted below.

***

### Installation

First clone this repo
```shell
git clone https://github.com/tgisdaehyun/SocketMost.git
cd SocketMost
```

***

### Installing NodeJS
If you don't have NodeJS installed you can use the help script to install it

```shell
chmod +x install_nodejs.sh
./install_nodejs.sh
```

***

### Building
To use the library it needs to be built

```shell
npm install
npm run build
```

***

#### Audio Drivers

```shell
cd dtoverlays

# Pi4
cd pi

# Pi5
cd pi5

# Build the overlay
dtc -@ -H epapr -O dtb -o piMost48KhzStereo.dtbo -Wno-unit_address_vs_reg piMost48KhzStereo.dts

# Copy the built overlay
sudo cp piMost48KhzStereo.dtbo /boot/overlays
```

Configure PulseAudio (`/etc/pulse/daemon.conf`):
```
default-sample-format = s16le
default-sample-rate = 48000
alternate-sample-rate = 48000
default-sample-channels = 2
default-channel-map = front-left,front-right
```

***

#### Boot config

```shell
# Bookworm / Trixie
sudo nano /boot/firmware/config.txt
```

Uncomment:
```shell
dtparam=i2s=on
dtparam=spi=on
```

Add:
```shell
dtoverlay=piMost48KhzStereo
```

Optional CAN bus:
```shell
dtoverlay=mcp2515-can1,oscillator=16000000,interrupt=25
```

***

#### Running

```shell
cd examples
LOG_LEVEL=debug node server.js
```

***

#### Using Most-Explorer

Download from: https://github.com/rhysmorgan134/most-explorer/releases

***

### Events

See [original README](https://github.com/rhysmorgan134/SocketMost#events) for full event documentation.
