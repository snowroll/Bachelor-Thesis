#-*- coding:utf-8 -*-

import numpy as np
import matplotlib.pyplot as plt
from sklearn import svm, datasets, ensemble
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler

from sklearn.metrics import roc_curve, auc
from sklearn.model_selection import train_test_split, StratifiedKFold
import pandas as pd

def read_data(filename):  # 读取训练数据
    Feature_Mat = []
    Label_Mat = []
    data = pd.read_csv(filename)
    data_count = len(data)
    for i in range(data_count):
        row = pd.Series.tolist(data.iloc[i])
        Feature_Mat.append(row[1:])
        Label_Mat.append(row[0])
    Feature_Mat = np.array(Feature_Mat)
    Label_Mat = np.array(Label_Mat)
    return Feature_Mat, Label_Mat

X, Y = read_data('./data.csv')
scaler = StandardScaler()  # 标准化转换
scaler.fit(X)  # 训练标准化对象
X = scaler.transform(X)  # 转换数据集
print(X[1])
random_state = np.random.RandomState(0)
# shuffle and split training and test sets
X_train, X_test, Y_train, Y_test = train_test_split(X, Y, test_size=.3,random_state=0)
print("data is ready")

clf = RandomForestClassifier()
clf.fit(X_train, Y_train)
Y_score = clf.predict(X_test)
# random_tree = ensemble.RandomForestClassifier(n_estimators=100, criterion='gini', max_depth=20,min_samples_split=20, \
#     min_samples_leaf=20, min_weight_fraction_leaf=0.0,max_features='auto', max_leaf_nodes=3, min_impurity_split=1e-07, \
#     bootstrap=True, oob_score=False, n_jobs=1, random_state=None, verbose=0,warm_start=False, class_weight=None)

# svm = svm.SVC(kernel='linear', probability=True, random_state=random_state)
# print("svm is ok")
# Y_score = random_tree.fit
# Y_score = svm.fit(X_train, Y_train).decision_function(X_test)
print("train is ok")
with open('ans-t-p.txt', 'w') as f:
    j = 0
    for i in range(len(Y_test)):
        f.write(str(Y_test[i]) + " " + str(Y_score[i]) + '\n')
        if Y_test[i] == Y_score[i]:
            j += 1
    f.write(str(j / len(Y_test)))

# Compute ROC curve and ROC area for each class
fpr,tpr,threshold = roc_curve(Y_test, Y_score) ###计算真正率和假正率
print('fpr ', fpr, 'tpr ', tpr, 'threshold', threshold)
roc_auc = auc(fpr,tpr) ###计算auc的值
print("compute roc")

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
plt.savefig("answer1.png")
plt.show()


