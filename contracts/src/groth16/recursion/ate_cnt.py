ate_cnt = [
    1, 1, 0, 1, 0, 0, -1, 0, 1, 1, 0, 0, 0, -1, 0, 0, 1, 1, 0, 0, -1, 0, 0, 0, 0,
    0, 1, 0, 0, -1, 0, 0, 1, 1, 1, 0, 0, 0, 0, -1, 0, 1, 0, 0, -1, 0, 1, 1, 0, 0,
    1, 0, 0, -1, 1, 0, 0, -1, 0, 1, 0, 1, 0, 0, 0,
]


line_cnt = 0 

# print('range', len(ate_cnt) - 46)
# for i in range(len(ate_cnt) - 46, len(ate_cnt) - 26): 
# for i in range(1, len(ate_cnt) - 46): 
for i in range(10, 21): 
    if ate_cnt[i] == 0: 
        line_cnt += 1 
    else: 
        line_cnt += 2 

print(line_cnt)