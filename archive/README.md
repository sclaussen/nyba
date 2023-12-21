# Process

For each league, generate 2.25 million possible schedules using all the organizational and team constraints, score them, and pick the top 50 for each league (thus 350 schedules from ~16 million).

Process combinations of the top 50 schedules from each league to find the combination of 7 schedules that has the minimal gym capacity constraint violations.

Pick the 7 separate schedules and generate the slightly flawed master schedule.

Manually modify the master schedule to accommodate the gym capacity constraints (only manual step).

Bind all the games in the master schedule to specific gym locations and time.

Print variations of the master schedule:
- by Home/Away Matrix
- by Location
- Master schedule (and then broken down by league)
- Normalized view



# Pipeline

```
# SCHEDULE
# for each league, generates possible schedules using info.yaml:teams and info.yaml:weeks constraints
# ideal schedules that fit ideal criteria written to <league>.yaml
# See sall.sh
node schedule <league> <majorloop> <minorloop> <threshold>
node schedule g4 1500 1500 15 g4.yaml
node schedule g56 1500 1500 10 g56.yaml
node schedule g789 1500 1500 10 g789.yaml
node schedule b45 1500 1500 10 b45.yaml
node schedule b6 1500 1500 10 b6.yaml
node schedule b7 1500 1500 10 b7.yaml
node schedule b89 1500 1500 10 b89.yaml

# COMBOS
# reads multiple schedule combinations from the <league>.yaml files, determines if they fit the info.yaml:gymConstraints
# generates combo.yaml for the best league schedule combinations (includes a violation counter property)
# See call.sh
node combos <base> <max> <threshold> <outfile>
node combos 1 5 3 combos.out

# PICK SCHEDULES
# Picks 7 schedules, one each from <league>.yaml, generates a combined master to pick1.yaml
node pick 1 2 3 4 5 6 7 pick1.yaml

# PRINT NORMALIZED
# reads master.yaml, prints the normalized schedule for the spreadsheet
node printNormalized pick1.yaml

# BIND GYMS
# reads pick1.yaml (master schedule), augments schedule with gyms, writes master.yaml (master schedule with gyms)
# generates master.yaml, contains master schedule for 7 leagues, augmented with gym time/location details
node bind pick1.yaml master.yaml

# PRINT MASTER SCHEDULE
# reads master.yaml files, prints primary master schedule
node printMaster master.yaml

# PRINT LOCATION
# reads master.yaml, prints master schedule by location
node printLocation master.yaml

# PRINT MATRIX
# reads master.yaml files, prints the home/away matrix for all leagues
node printMatrix master.yaml
```



# Conditional Formatting

K AD
13
24
35
46
57
68
79



K3:AD12
K14:AD23
K25:AD34
K36:AD45
K47:AD56
K58:AD67
K69:AD78

AI3:BB12
AI14:BB23
AI25:BB34
AI36:BB45
AI47:BB56
AI58:BB67
AI69:BB78

AI BB


K3:AD12,K14:AD23,K25:AD34,K36:AD45,K47:AD56,K58:AD67,K69:AD78,AI3:BB12,AI14:BB23,AI25:BB34,AI36:BB45,AI47:BB56,AI58:BB67,AI69:BB78
=OR(AND(K3>1, K3<4, ISNUMBER(K3)), AND(K3>4, ISNUMBER(K3)))
