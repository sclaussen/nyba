#!/bin/sh
node bind master.unbound.yaml master.bound.yaml
node printNormalized master.bound.yaml > master.normalized
node printMaster master.bound.yaml > master.master
node printMasterVertical master.bound.yaml > master.mastervertical
node printLocation master.bound.yaml > master.location
node printHomeAway master.bound.yaml > master.homeaway
