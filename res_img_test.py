from super_image import EdsrModel, ImageLoader
from PIL import Image
import requests

image = Image.open('test_img.jpg')

model = EdsrModel.from_pretrained('eugenesiow/edsr-base', scale=2)      # scale 2, 3 and 4 models available
inputs = ImageLoader.load_image(image)
preds = model(inputs)

ImageLoader.save_image(preds, './scaled_2x.png')                        # save the output 2x scaled image to `./scaled_2x.png`
ImageLoader.save_compare(inputs, preds, './scaled_2x_compare.png')      # save an output comparing the super-image with a bicubic scaling
