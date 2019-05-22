#-*- coding:utf-8 -*-
#author: chaihj 2019/05/21
#检测混淆算法1

import re
from math import *
import os

ascii_regex = re.compile(r'[0-9a-zA-Z]')

def N_GRAM(_str):
    n_gram = 0
    whole_num = len(_str)
    ascii_num = 0
    ascii_list = re.findall(ascii_regex, _str)
    for i in ascii_list:
        ascii_num += len(i)
    n_gram = 1 - (ascii_num / whole_num)
    return n_gram

def Entropy(_str):
    bset = []
    bset_num = {}
    E_B = 0
    for i in _str:
        if i not in bset:
            bset.append(i)
    T = len(_str)
    for i in bset:
        bset_num[i] = _str.count(i)
        E_B = E_B - (bset_num[i] / T) * log(bset_num[i]/T)
    return E_B

def Word_Size(_str):
    word_set = _str.split(' ')
    max_size = 0
    for i in word_set:
        max_size = max(len(i), max_size)
    return max_size

def detect(filename):  #检测是否反混淆，是 返回True  否 返回False
    whole_string = ""  
    with open(filename, 'r') as f:
        for i in f:
            whole_string += i

    N_gram = N_GRAM(whole_string) #特殊字符（除数字、字母外）所占比例
    E_B = Entropy(whole_string)  #熵值 小于1.2认为是混淆的
    max_size = Word_Size(whole_string)  #单词大小大于350 认为有混淆
    if E_B < 1.2 or max_size > 350:
        return True
    else: 
        return False

def main():
    detect_class = []
    origin_class = []
    filenames    = []
    path = "/Users/chaihj15/Desktop/Data/test_data" #+ index_name  # 文件夹目录
    files = os.listdir(path)  # 得到文件夹下的所有文件名称
    i = 0
    for f in files:  # 遍历文件夹
        file_path = os.path.join(path, f)
        if not os.path.isdir(file_path):  # 判断是否是文件夹，不是文件夹才打开
            try:
                filename = file_path.split('/')[-1]
                _class = detect(file_path)
                detect_class.append(int(_class))
                filenames.append(filename)
                if "_black" in file_path:
                    origin_class.append(1)
                else:
                    origin_class.append(0)
            except UnicodeDecodeError as e:
                continue 
            if i % 100 == 0:
                print(i)
            i += 1
        else:
            child_files = os.listdir(file_path)  #是文件夹则读取文件夹下的内容
            for f in child_files:  # 遍历文件夹
                child_file_path = os.path.join(file_path, f)
                if not os.path.isdir(child_file_path):  # 判断是否是文件夹，不是文件夹才打开
                    try:
                        filename = child_file_path.split('/')[-1]
                        _class = detect(child_file_path)
                        detect_class.append(int(_class))
                        filenames.append(filename)
                        if "_black" in child_file_path:
                            origin_class.append(1)
                        else:
                            origin_class.append(0)
                    except UnicodeDecodeError as e:
                        continue
                    if i % 100 == 0:
                        print(i)
                    i += 1
    right_num = 0
    with open('detect1_res.txt', 'w') as f:
        for i in range(len(filenames)):
            f.writelines(filenames[i] + " " + str(origin_class[i]) + " " + str(detect_class[i]) + "\n")
            if(origin_class[i] == detect_class[i]):
                right_num += 1
        f.writelines("Accuracy: " + str(right_num/len(filenames)))

if __name__ == "__main__":
    main()
