import os
import urllib.request, urllib.parse, urllib.error

files = [
	'js/libs/Stadista.js',
	'js/libs/AudioContextMonkeyPatch.js',
	'js/libs/Detector.js',
	'js/libs/Tween-7dev.js',
	'js/libs/Three-r49.js',
	'js/CollisionUtils.js',
	'js/StringFormat.js',
	'js/utils.js',
	'js/3400_DisplayControls.js',
	'js/3400_Objects.js',
	'js/3400.js',
]

outfile = '../js/main_compressed.js'

# ~~~

def get_response(data):
	post_data = urllib.parse.urlencode(data)
	request = urllib.request.Request('https://closure-compiler.appspot.com/compile', post_data.encode())
	response = urllib.request.urlopen( request )

	compressed = response.read()
	
	return compressed

string = ''

for filename in files:
	with open('../' + filename, 'r') as f:
		string += f.read() + "\n"

print('Files collected')

print('Calling Closure API service...')

values = {
	'compilation_level': 'SIMPLE_OPTIMIZATIONS',
	'output_format': 'text',
	'output_info': 'compiled_code',
	'js_code': string
}

compressed_js = get_response( values )

print('compressed size', len( compressed_js) )

if len(compressed_js) == 1:
	print('BOOOH ERRORS FOUND!!!')
	values['output_info'] = 'errors'
	
	errors = get_response( values )
	print(errors)

else:

	with open(outfile, 'wb') as f:
		f.write(compressed_js)
