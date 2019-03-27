#-*- coding:utf-8 -*-
import re
import os  # 读取文件
import pandas as pd  # csv文件

js_keywords = []
with open("../Feature/features_before.txt", 'r') as f:  # js语言的关键字作为特征
    for i in f:
        js_keywords.append(i.strip("\n"))

double_number = r'[0-9]{2,5}'  # 数字
comment = r'[^:]//(.*)'  # 短注释
comment_long = r'/\*(.*?)\*/'  # 长注释
repet = r'([0-9a-zA-Z])\1{1,}'
call = r'[a-zA-Z0-9_]+\([a-zA-Z0-9_, \-\'\"]*\)'  # 方法调用
argument = r'[a-zA-Z0-9_]+\((.*?)\)'  # 方法参数
_hex = r'[0\\]x[0-9a-fA-F]+'  # 16进制数
operators = ["+", "-", "*", "/", "=", "+=", "*=", "%=", "/=", "-=", "++", "--"]


def isreadable(word):  # 判断一个单词是否可读
    if len(word) > 25:
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
    len_characters = 0
    script_str = ""
    long_unread = 0
    number_count = 0
    # ratio_number = 0
    keyword_dict = {}
    last_name = filename.split("/")[-1]

    with open(filename, 'r') as f:
        lines = 0
        tab_lines = 0
        comment_num = 0
        for i in f:
            com = re.findall(comment, i, re.S | re.M) # 单行注释
            double_number_n = re.findall(double_number, i, re.S | re.M)  #数字
            number_count += len(double_number_n)
            if len(com):
                comment_num += len(com)
            if i[0:2] == '  ':
                tab_lines += 1
            lines += 1
            script_str += i
            len_characters += len(i)
            if(len(i) >= 1000):
                token = re.split("[,./?';\"\{\}\[\])( =\%-]", i)
                for j in token:
                    if(len(j) >= 1000):
                        long_unread += 1
        per_line = 0 if not lines else len_characters / lines  # 每行的字符数
        tab_ratio = tab_lines / lines  # 有tab的代码行占比
        tokens = re.split("[,./?';\"\{\}\[\])( +=\%-]", script_str)  # 将每行分解为单个词语的集合

        signle_chr = 0  # 单个字母字符  a b c...
        alpha_dig_num = 0  # w32 类似符号的集合
        for i in tokens:
            if len(i) == 1 and str.isalpha(i):
                signle_chr += 1
            if len(i) < 4 and len([j for j in i if j.isdigit()]):
                alpha_dig_num += 1         

        word_num = len(tokens)  # 单词个数
        # ratio_number = number_count / word_num
        
        avg_string = 0 if not word_num else len_characters / word_num  # 每个单词平均长度

        white_space = 0 if not len_characters else script_str.count(" ") / len_characters  # 空白字符占比

        com_mul = re.findall(comment_long, script_str, re.S | re.M)  # 多行注释
        for i in com_mul:
            comment_num += len(i)
        avg_comment = 0 if not lines else comment_num / lines  # 平均每行的comment数量

        operator_num = 0
        for i in operators:
            operator_num += script_str.count(i)
        ratio_operator = (0, operator_num / word_num)[bool(word_num)]  # operator_num

        methods = re.findall(call, script_str, re.S | re.M)  # 方法调用
        methods_num = len(methods)

        argument_len = 0
        for i in methods:
            arguments = re.findall(argument, i, re.S | re.M)  # 方法参数
            for j in arguments:
                if len(j):
                    argument_len += len(j)
        per_argument =  0 if not methods_num else argument_len / methods_num  # 每个方法的平均参数长度

        read_num = 0  # 可读单词比例
        for i in tokens:
            if isreadable(i):
                read_num += 1
        ratio_read = 0 if not word_num else read_num / word_num

        hexadecimal_num = len(re.findall(_hex, script_str, re.S | re.M))  # 16进制的个数

        for i in js_keywords:
            keyword_dict[i] = script_str.count(i)
        
        features_dict = \
        {"filename":last_name,"property": _property, "len_characters": len_characters, "per_line": per_line, "lines": lines, "tab_ratio" : tab_ratio, \
         "word_num": word_num, "ratio_space": white_space, "signle_chr": signle_chr, "alpha_dig_num": alpha_dig_num, "methods_num": methods_num, \
         "hex_num": hexadecimal_num, "comment_num": comment_num, "avg_comment": avg_comment,  "avg_argument": per_argument, \
         "ratio_read": ratio_read,  "ratio_operator": ratio_operator}

        features_dict.update(keyword_dict)  # 合并关键词特征和计算后的特征
        # for i in features_dict:
        #     print(i)
        return features_dict

def extract_feature():  # 训练集中提取样本features
    i = 0
    # file_list = []
    # for i in range(1, 11):
    #     file_list.append(str(i))
    # file_list.append("blackJS")

    df = pd.DataFrame(columns=('filename', 'property', 'len_characters', 'per_line', 'lines', 'tab_ratio', 'word_num', 'ratio_space', 'signle_chr', 'alpha_dig_num', 'methods_num', 'hex_num', \
        'comment_num', 'avg_comment', 'avg_argument', 'ratio_read', 'ratio_operator', 'var','return','function','term','length','else','new','null','prototype','type','typeof','Module','style', \
        'fn','com','document','class','url','text','title','src','ie','data','href','cn','window','if','name','location','www','link','contentStr','titleStr','WEA','images','true',\
        'false','js','Math','event','element','break','parentNode','jQuery','position','html','default'))
    # for index_name in file_list:
    #     print(index_name)
    path = "/Users/chaihj15/Desktop/Data/test_data" #+ index_name  # 文件夹目录
    files= os.listdir(path)  # 得到文件夹下的所有文件名称
    for f in files:  # 遍历文件夹
        file_path = os.path.join(path, f)
        if not os.path.isdir(file_path):  # 判断是否是文件夹，不是文件夹才打开
            # print(file_path)
            try:
                if "_black" in file_path:
                    _dict = get_features(file_path, "1")
                else:
                    _dict = get_features(file_path, "0")
            except UnicodeDecodeError as e:
                continue
            df.loc[i] = list(_dict.values())  
            if i % 100 == 0:
                print(i)
            i += 1
        else:
            child_files = os.listdir(file_path)  #是文件夹则读取文件夹下的内容
            for f in child_files:  # 遍历文件夹
                child_file_path = os.path.join(file_path, f)
                if not os.path.isdir(child_file_path):  # 判断是否是文件夹，不是文件夹才打开
                    # print(file_path)
                    try:
                        if "_black" in child_file_path:
                            _dict = get_features(child_file_path, "1")
                        else:
                            _dict = get_features(child_file_path, "0")
                    except UnicodeDecodeError as e:
                        continue
                    df.loc[i] = list(_dict.values())  
                    if i % 100 == 0:
                        print(i)
                    i += 1
    df.to_csv("/Users/chaihj15/Desktop/Data/test_data/" + "data.csv", index = False, sep=',')

extract_feature()
