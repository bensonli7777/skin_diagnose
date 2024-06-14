import os
import pymysql
from datetime import datetime

# 连接 MySQL 数据库
def create_connection():
    connection = pymysql.connect(host='localhost',
                                user='root',
                                password='ku64101098',
                                db='login_system',
                                charset='utf8mb4',
                                cursorclass=pymysql.cursors.DictCursor)
    return connection

def register_user(username, password):
    connection = create_connection()
    cursor = connection.cursor()
    try:
        cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (username, password))
        connection.commit()
        return True, "註冊成功"
    except Exception as e:
        return False, f"註冊失敗: {str(e)}"
    finally:
        cursor.close()
        connection.close()

def login_user(username, password):
    connection = create_connection()
    cursor = connection.cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE username=%s AND password=%s", (username, password))
        user = cursor.fetchone()
        if user:
            return True, user
        else:
            return False, "用戶名或密碼錯誤"
    finally:
        cursor.close()
        connection.close()

def view_users():
    connection = create_connection()
    try:
        with connection.cursor() as cursor:
            sql = "SELECT * FROM users"
            cursor.execute(sql)
            result = cursor.fetchall()
            if result:
                print("Users table data:")
                for row in result:
                    print(row)
            else:
                print("No data found in the users table.")
    except Exception as e:
        print("Failed to retrieve data:", e)
    finally:
        connection.close()

def user_exists(username):
    connection = create_connection()
    cursor = connection.cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE username=%s", (username,))
        user = cursor.fetchone()
        return user is not None
    except Exception as e:
        print("Failed to check user existence:", e)
        return False
    finally:
        cursor.close()
        connection.close()

def insert_photo(username, photo_path, diagnosis):
    if not user_exists(username):
        print("User does not exist.")
        return
    
    with open(photo_path, 'rb') as file:
        photo = file.read()

    upload_time = datetime.now()

    connection = create_connection()
    try:
        with connection.cursor() as cursor:
            sql = "INSERT INTO user_photos (username, photo, upload_time, diagnosis) VALUES (%s, %s, %s, %s)"
            cursor.execute(sql, (username, photo, upload_time, diagnosis))
        connection.commit()
        print("Photo inserted successfully.")
    except Exception as e:
        print("Failed to insert photo:", e)
    finally:
        connection.close()

def retrieve_user_history(username):
    connection = create_connection()
    try:
        with connection.cursor() as cursor:
            sql = "SELECT photo, upload_time, diagnosis FROM user_photos WHERE username=%s"
            cursor.execute(sql, (username,))
            result = cursor.fetchall()
            if result:
                history_data = []
                for row in result:
                    history_data.append({
                        'photo': row['photo'],
                        'upload_time': row['upload_time'],
                        'diagnosis': row['diagnosis']
                    })
                return history_data
            else:
                print("No photos found for the given username.")
                return []
    except Exception as e:
        print("Failed to retrieve photo:", e)
        return []
    finally:
        connection.close()

if __name__ == "__main__":
    # 注册用户
    success, message = register_user('benson', '0000')
    print(message)

    # 用户登录
    success, result = login_user('benson', '0000')
    if success:
        print("Login successful:", result)
    else:
        print(result)

    # 插入照片和诊断记录
    insert_photo('benson', 'project/uploads/croppedImage.png', '診斷結果')

    # 检索用户历史记录
    history = retrieve_user_history('benson')
    for record in history:
        print(record)