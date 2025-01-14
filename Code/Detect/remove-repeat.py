#-*- coding:utf-8 -*-
import os, shutil
import hashlib 
import logging 
import sys 
  
def logger(): 
    """ 获取logger"""
    logger = logging.getLogger() 
    if not logger.handlers: 
        # 指定logger输出格式 
        formatter = logging.Formatter('%(asctime)s %(levelname)-8s: %(message)s') 
        # 文件日志 
        file_handler = logging.FileHandler("test.log") 
        file_handler.setFormatter(formatter) # 可以通过setFormatter指定输出格式 
        # 控制台日志 
        console_handler = logging.StreamHandler(sys.stdout) 
        console_handler.formatter = formatter # 也可以直接给formatter赋值 
        # 为logger添加的日志处理器 
        logger.addHandler(file_handler) 
        logger.addHandler(console_handler) 
        # 指定日志的最低输出级别，默认为WARN级别 
        logger.setLevel(logging.INFO) 
    return logger 
  
def get_md5(filename): 
    m = hashlib.md5() 
    mfile = open(filename, "rb") 
    m.update(mfile.read()) 
    mfile.close() 
    md5_value = m.hexdigest() 
    return md5_value 
  
def get_urllist(index_name): 
 #替换指定的文件夹路径即可 
    base = "/Users/chaihj15/Desktop/Data/" + index_name + "/" 
    list = os.listdir(base) 
    urlList=[] 
    for i in list: 
        url = base + i 
        urlList.append(url) 
    return urlList 
  
if __name__ == '__main__': 
    log = logger() 
    md5List =[] 
    count = 0
    for i in range(1, 11):
        print(i)
        urlList =get_urllist(str(i)) 
        for a in urlList: 
            shutil.copy(a, '/Users/chaihj15/Desktop/Data/train_data/' + str(count) + '.txt')
            count += 1
            
        #     md5 =get_md5(a) 
        #     if (md5 in md5List): 
        #         os.remove(a) 
        #         print("重复：%s"%a) 
        #         log.info("重复：%s"%a) 
        #     else: 
        #         md5List.append(md5) 
        # # print(md5List) 
        # print("一共%s张照片"%len(md5List))
