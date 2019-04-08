#-*- coding:utf-8 -*-
import os
import re
import collections

split_char = "[,./\?';\"\{\}\[\] +=-]"
freq_global = {}

def count_num(text):
    frequency = {}
    words = re.split(split_char, text)
    for i in words:
        if str.isalpha(i) and len(i) < 12:
            if i in freq_global:
                freq_global[i] += 1
            else:
                freq_global[i] = 1
            if i in frequency:
                frequency[i] += 1
            else:
                frequency[i] = 1
    return frequency

def get_word_num(dir_name):
    freq_list = []
    files = os.listdir(dir_name)
    i = 0 
    text = ""
    for f in files: 
        filename = os.path.join(dir_name, f)   
        with open(filename) as f:
            try:
                if i % 100 != 0:
                    text += f.read()
                else:
                    print(i)
                    frequency = count_num(text)
                    # L = sorted(frequency.items(),key=lambda item:item[1],reverse=True)
                    # L = L[:20]
                    # freq_list.append(L)
                    text = f.read()
            except UnicodeDecodeError as e:
                continue
        i += 1
    return freq_list

with open("word_counter_white.txt", 'w') as f:
    for i in range(1, 11):
        freq_list = get_word_num("/Users/chaihj15/Desktop/Data/" + str(i))
        # for instance in freq_list:
        #     f.writelines(str(instance))
        #     f.write("\n")

    L = sorted(freq_global.items(),key=lambda item:item[1],reverse=True)
    L = L[:70]
    for i in L:
        f.writelines(str(i))
        f.write("\n")
        # row = ""
        # for j in instance:
        #     row += ' '.join(str(j)
        #     row += " "
        # f.write(row + "\n")


