#-*- coding:utf-8 -*-
import re
import os  # 读取文件
import pandas as pd  # csv文件


filename = "benign.txt"

js_keywords = []
with open("features.txt", 'r') as f:  # js语言的关键字作为特征
    for i in f:
        js_keywords.append(i.strip("\n"))

comment = r'[^:]//(.*)'  # 短注释
comment_long = r'/\*(.*?)\*/'  # 长注释
repet = r'([0-9a-zA-Z])\1{1,}'
call = r'[a-zA-Z0-9_]+\([a-zA-Z0-9_, \-\'\"]*\)'  # 方法调用
argument = r'[a-zA-Z0-9_]+\((.*?)\)'  # 方法参数
_hex = r'[0\\]x[0-9a-fA-F]+'  # 16进制数
operators = ["+", "-", "*", "/", "=", "+=", "*=", "%=", "/=", "-=", "++", "--"]


def isreadable(word):  # 判断一个单词是否可读
    if len(word) > 30:
        return False
    alpha_num = 0
    vowel_num = 0
    vowel = 'aeiou'
    for i in word:
        if i.isalpha():
            alpha_num += 1
        if i in vowel:
            vowel_num += 1
    if len(word) == 0:
        return False
    if alpha_num / len(word) < 0.7 or vowel_num / len(word) < 0.2 or vowel_num / len(word) > 0.6:
        return False
    repeat_words = re.findall(repet, word, re.S | re.M)
    if len(repeat_words) > 2:
        return False
    return True

def get_features(filename, _property):  # 手工添加最后一个特征， 良性或恶意
    comment_words = 0
    len_characters = 0
    script_str = ""
    keyword_dict = {}

    with open(filename, 'r') as f:
        lines = 0
        comment_num = 0
        for i in f:
            com = re.findall(comment, i, re.S | re.M) # 单行注释
            if len(com):
                comment_num += 1
                for i in com:
                    comment_words += len(i.split())
            lines += 1
            script_str += i
            len_characters += len(i)
        per_line = 0 if not lines else len_characters / lines  # 每行的字符数
        tokens = script_str.split()

        string_num = len(tokens)  # 单词个数
        avg_string = 0 if not string_num else len_characters / string_num  # 每个单词平均长度

        white_space = 0 if not len_characters else script_str.count(" ") / len_characters  # 空白字符占比
        com2 = re.findall(comment_long, script_str, re.S | re.M)  # 多行注释
        for i in com2:
            comment_num += i.count("\n")  # comment
            comment_words += len(i.split())  # comment的数量
        avg_comment = 0 if not lines else comment_num / lines  # 平均每行的comment数量
        per_comment = 0 if not string_num else 1 - comment_words / string_num  # 不在comment中的单词占比

        operator_num = 0
        for i in operators:
            operator_num += script_str.count(i)

        methods = re.findall(call, script_str, re.S | re.M)  # 方法调用
        methods_num = len(methods)
        argument_len = 0
        for i in methods:
            arguments = re.findall(argument, i, re.S | re.M)  # 方法参数
            for j in arguments:
                if len(j):
                    argument_len += len(j)

        per_argument = 0 if not methods_num else argument_len / methods_num  # 每个方法的平均参数长度
        read_num = 0  # 可读单词比例
        for i in tokens:
            if isreadable(i):
                read_num += 1
        ratio_read = 0 if not string_num else read_num / string_num

        hexadecimal_num = len(re.findall(_hex, script_str, re.S | re.M))  # 16进制的个数

        for i in js_keywords:
            keyword_dict[i] = script_str.count(i)
        
        features_dict = {"property": _property, "len_characters": len_characters, "per_line": per_line, "lines": lines, "string_num": string_num, \
            "hexadecimal_num": hexadecimal_num, "ratio_read": ratio_read, "white_space": white_space, "methods_num": methods_num, \
            "avg_string": avg_string, "avg_comment": avg_comment, "comment_num": comment_num, "per_comment": per_comment, \
            "operator_num": operator_num, "per_argument": per_argument}

        features_dict.update(keyword_dict)  # 合并关键词特征和计算后的特征
        return features_dict

path = "/Users/chaihj15/Desktop/test_data"  # 文件夹目录
files= os.listdir(path)  # 得到文件夹下的所有文件名称
i = 0
for f in files:  # 遍历文件夹
    file_path = os.path.join(path, f)
    if not os.path.isdir(file_path):  # 判断是否是文件夹，不是文件夹才打开
        print(file_path)
        try:
            _dict = get_features(file_path, "benign")
        except UnicodeDecodeError as e:
            continue
        if i == 0:
            new_dict = {}
            for key in _dict:
                new_dict[key] = [_dict[key]]
                print(_dict[key], new_dict[key])
            df = pd.DataFrame(new_dict)
            df = df[list(_dict.keys())]
        else:
            df.loc[i] = list(_dict.values())  
        i += 1
df.to_csv("test.csv", index = True, sep=',')
          