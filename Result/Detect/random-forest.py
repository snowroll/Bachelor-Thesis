#-*- coding:utf-8 -*-

import numpy as np
import matplotlib.pyplot as plt
from sklearn import svm, datasets, ensemble
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.externals import joblib

from sklearn.metrics import roc_curve, auc, roc_auc_score
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.grid_search import GridSearchCV
import pandas as pd

def read_data(filename):  # 读取训练数据
    Feature_Mat = []
    Label_Mat = []
    File_Mat = []
    data = pd.read_csv(filename)
    data_count = len(data)
    for i in range(data_count):
        row = pd.Series.tolist(data.iloc[i])
        Feature_Mat.append(row[2:])  # 暂时去掉关键词
        Label_Mat.append(row[1])
        File_Mat.append(row[0])
    Feature_Mat = np.array(Feature_Mat)
    Label_Mat = np.array(Label_Mat)
    File_Mat = np.array(File_Mat)
    return Feature_Mat, Label_Mat, File_Mat

train_X, train_Y, train_F = read_data('../Data/train_data/data.csv')
test_X, test_Y, test_F = read_data('../Data/test_data/data.csv')
scaler = StandardScaler()  # 标准化转换
scaler.fit(train_X)  # 训练标准化对象
train_X = scaler.transform(train_X)  # 转换数据集
scaler_test = StandardScaler()
scaler_test.fit(test_X)
test_X = scaler_test.transform(test_X)

print("data is ready")

# 开始训练 调参
clf = RandomForestClassifier(n_estimators=50, min_samples_split=20 )
clf.fit(train_X, train_Y)
Y_score = clf.predict(test_X)
print("max_depth ", clf.max_depth, " min_sample_split ", clf.min_samples_split, " min_sample_leaf ", clf.min_samples_split, \
    "max_fetures ", clf.max_features)
print(clf.feature_importances_) 
joblib.dump(clf, 'train_model.m')



#n_estimators 50  'max_depth': 9,  'min_samples_leaf': 10, 'min_samples_split': 80  max_features': 7
#n_estimators 50 min_samples_split 20   96%

# print("AUC socre", roc_auc_score(train_Y, Y_score))

print("train is ok")
with open('test/ans-t-p.txt', 'w') as f:
    j = 0
    for i in range(len(test_Y)):
        f.write(str(test_F[i]) + " " + str(test_Y[i]) + " " + str(Y_score[i]) + '\n')
        if test_Y[i] == Y_score[i]:
            j += 1
    f.write(str(j / len(test_Y)))

# Compute ROC curve and ROC area for each class
fpr,tpr,threshold = roc_curve(test_Y, Y_score) ###计算真正率和假正率
print('fpr ', fpr, 'tpr ', tpr, 'threshold', threshold)
roc_auc = auc(fpr,tpr) ###计算auc的值

plt.figure()
lw = 2
plt.figure(figsize=(10,10))
plt.plot(fpr, tpr, color='darkorange',
         lw=lw, label='ROC curve (area = %0.2f)' % roc_auc) ###假正率为横坐标，真正率为纵坐标做曲线
plt.plot([0, 1], [0, 1], color='navy', lw=lw, linestyle='--')
plt.xlim([0.0, 1.0])
plt.ylim([0.0, 1.05])
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('Receiver operating characteristic example')
plt.legend(loc="lower right")
plt.savefig("test/answer1.png")
plt.show()


