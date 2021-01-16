# TimerBridge for Farmtek

TimerBridge is a bridge between the FarmTek Polaris line of timing consoles, and a remote system.

It currently supports the [vMix Live Video Production software](https://www.vmix.com/) using its TCP API, but can be expanded to support other remote system in future.

## Requirements

* A FarmTek Polaris Timing console
* NodeJS 14.0.0 or greater
* A [Computer Interface cable](https://farmtek.net/computer.html) to connect the console to your computer

## Installation

I recommend use of the [Node Version Manager](https://github.com/nvm-sh/nvm), after which you can install the correct version of NodeJS for the current version:

```
nvm install && nvm use
```

And then install the dependencies:
```
npm ci
```


## Notes

* At present this software requires reconfiguration of your Timer. You can find information on how to do this by contacting Farmtek support.
* I hope to add try an alternate method by decoding the Scoreboard output so that a different cable is required instead of timer reconfiguration.
* I do not have my own Timer to test with so am currently reliant upon the information I've been provided, and limited access I have to a real timer for testing

## Making your own cable

The official cable is available [direct from Farmtek](https://farmtek.net/computer.html), but if you are handy with a soldering iron you can easily make your own using a 3.5mm stereo jack, and a Female DB9 shell.

The Output on the Farmtek console has three pins which are known as the "Tip", "Ring", and "Sleeve":
* Tip: Not used (This carries the data sent to the official Farmtek Scoreboard)
* Ring: Data pin carrying data from the Farmtek console. Connect to RCV pin on Serial port (DB-9 pin 2)
* Sleeve: Ground connection. Connect to GND pin on Serial port (DB-9 pin 4)
