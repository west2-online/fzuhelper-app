# 签到二维码，用于学习中心扫码

import qrcode
from datetime import datetime, timedelta
from IPython.display import display, clear_output

def generate_qr_code():
    current_time = datetime.now()
    next_minute_time = current_time + timedelta(minutes=1)

    current_time_str = current_time.strftime("%Y-%m-%d %H:%M:%S")
    next_minute_time_str = next_minute_time.strftime("%Y-%m-%d %H:%M:%S")

    qr_content = f"seatSignInCode@{current_time_str}@{next_minute_time_str}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_content)
    qr.make(fit=True)

    img = qr.make_image(fill='black', back_color='white')

    # 生成二维码的ASCII图形
    qr_ascii = qr.get_matrix()
    for row in qr_ascii:
        print(''.join(['██' if col else '  ' for col in row]))

    return img, qr_content



img, qr_content = generate_qr_code()

clear_output(wait=True)

display(img)
print(f"QR Code Content: {qr_content}")