ate_cnt = [
    1, 1, 0, 1, 0, 0, -1, 0, 1, 1, 0, 0, 0, -1, 0, 0, 1, 1, 0, 0, -1, 0, 0, 0, 0,
    0, 1, 0, 0, -1, 0, 0, 1, 1, 1, 0, 0, 0, 0, -1, 0, 1, 0, 0, -1, 0, 1, 1, 0, 0,
    1, 0, 0, -1, 1, 0, 0, -1, 0, 1, 0, 1, 0, 0, 0,
]


line_cnt = 0 

for i in range(len(ate_cnt) - 5, len(ate_cnt)): 
# for i in range(1, len(ate_cnt) - 50): 
    if ate_cnt[i] == 0: 
        line_cnt += 1 
    else: 
        line_cnt += 2 

print(line_cnt)