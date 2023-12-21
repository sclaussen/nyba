#!/bin/sh

# Associates nohome5and8and9
if [ `grep noHomeGymWeeks info.yaml | grep "5" | wc -l` -ne "10" ]; then
    echo Associates nohome5and8and9 error
fi


# CYS nohome4
if [ `grep noHomeGymWeeks info.yaml | grep "4" | wc -l` -ne "9" ]; then
    echo CYS nohome4 error
fi


# Tricity double1and2
if [ `grep fixedHomeGameWeeks info.yaml | grep "1, 2" | wc -l` -ne "10" ]; then
    echo Tricity double1and2 error
fi


# JYO nohome7
if [ `grep noHomeGymWeeks info.yaml | grep 7 | wc -l` -ne "8" ]; then
    echo JYO nohome7 error
fi


# JYO jamboree7
if [ `grep fixedHomeGameWeeks info.yaml | grep 7 | wc -l` -ne "7" ]; then
    echo JYO jamboree7 error
fi


# JYO off5and9
if [ `grep byeWeeks info.yaml | grep 5 | wc -l` -ne "15" ]; then
    echo JYO off5and9 error
fi
