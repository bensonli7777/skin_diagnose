from flask import Blueprint, render_template

disease_info = Blueprint('disease_info', __name__)

@disease_info.route('/disease/<disease_name>')
def disease(disease_name):
    disease_data = {
        'nm,normal': {
            'title': '正常皮膚',
            'description': '你的皮膚很正常，很棒請繼續保持！',
            'treatment': '維持現狀就行'
        },
        'nv,melanocytic nevi': {
            'title': 'Melanocytic nevus',
            'description': '黑素細胞痣，又稱痣細胞痣，是一種人類常見的良性腫瘤，發生於皮膚的黑素細胞（痣細胞）。 黑素細胞痣的天生攜帶率達到1%，常在2歲後發生。 而後天也可能由於紫外線照射等原因產生，一般為良性。',
            'treatment': '治療方法:手術切除、化療或免疫療法'
        },
        'mel,melanoma': {
            'title': 'Melanoma',
            'description': '黑色素瘤，又稱惡性黑色素瘤，是一種從黑色素細胞發展而來的癌症，全球約有23萬人感染此病。好發於皮膚但也可能出現在口腔、腸道或眼睛中。女性患者的黑色素瘤最常出現在腿，而男性患者則最常出現在背部。有時黑色素瘤是由痣轉變發展而來，有這種轉變的痣外觀上的改變包括尺寸變大、邊緣變得不規則、顏色改變、發癢、或皮膚破壞。',
            'treatment':'治療方法:手術切除、標靶治療或免疫療法'
        },
        'bkl,benign keratosis-like lesions': {
            'title': 'Benign keratosis',
            'description': '脂溢性角化病，又叫老年疣、脂溢性疣，是一種角化細胞增生導致的良性腫瘤，主要發生於老年群體中，這種腫瘤的顏色從淺褐色到黑色不等，通常呈圓形或橢圓形，表面扁平或稍有隆起。大小不定，可超過2.5公分。它們可能會和基底細胞癌等其他皮膚疾病一同出現，研究表示鱗狀細胞癌等惡性腫瘤有3.1%的概率被誤診為脂溢性角化病。',
            'treatment': '治療方法: 冷凍治療、電燒處理或雷射治療'
        },
        'bcc, basal cell carcinoma': {
            'title': 'Basal cell carcinoma',
            'description': '基底細胞癌或稱基底細胞瘤，是最常見的皮膚癌症。 患者的皮膚通常會先長出一塊無痛的隆起部分，其上可能佈有具光澤的蛛網紋或是潰瘍。 此種癌症的生長速度緩慢，並會損傷其周邊的組織，但不太可能出現遠端轉移，也不太會直接導致死亡。',
            'treatment': '治療方法: 手術切除、放射線治療或化學治療'
        },
        'vasc, pyogenic granulomas and hemorrhage': {
            'title': 'Vascular lesion',
            'description': '血管瘤是一種很常見的、非惡性的且不會傳染的血管內膜腫瘤，也是最常見的血管性胎記，由不正常的血管內壁細胞增生，通常於出生或出生後的幾週內產生，在經驗過一段增生期快速生長後，多數會經過幾年的時間慢慢退化消失。',
            'treatment': '治療方法:電燒、冷凍治療或雷射治療'
        },
        'akiec,Actinic keratoses and intraepithelial carcinomae': {
            'title': 'Actinic keratosis',
            'description': '日光角化症是鱗狀細胞原位癌的一種，為形成皮膚鱗狀細胞癌的前身，主要形成的原因是皮膚長期日曬所造成的病變。 一般來說，日光角化症的患者皮膚表面會粗粗的、有皮膚及脫皮的現象，且呈現斑塊或丘疹狀，而外型顏色大多呈現紅色、棕色或膚色，常被誤認為是老人斑(脂漏性角化症)或濕疹，但並無搔癢感。',
            'treatment': '治療方法: 冷凍療法、手術切除、二氧化碳雷射或是放射線療法'
        },
        'df,dermatofibroma': {
            'title': 'Dermatofibroma',
            'description': '皮膚纖維瘤是由成纖維細胞或組織細胞灶性增生引起的一種真皮內的良性腫瘤。這種疾病可以發生在任何年齡，但以中青年多見，女性患病率高於男性。它可能自然發生，也可能是由外傷後引起的。黃褐色或淡紅色的皮內丘疹或結節是這種疾病的典型臨床特徵。病變生長緩慢，長期存在，極少自行消退。',
            'treatment': '治療方法:手術切除'
        },    
    }  
    # 判斷不同疾病名稱決定提取哪個data
    info = disease_data.get(disease_name)
    return render_template('disease_info.html', info=info)
