#!/usr/bin/python

import os, time, sys, shutil

def sources():
	print ('sources')
	path = './src/main'
	return [os.path.join(base, f) for base, folders, files in os.walk(path) for f in files if (f.endswith('.js') and 'Control' not in f)]

def build():
	print ('build')
	path = './src/test/js/mm.js'
	data = '\n'.join(open(file, 'r').read() for file in sources())
	with open(path, 'w') as f:
		f.write(data)
	print ('built %s (%u bytes)' % (path, len(data))) 
	# os.remove('./src/main/node_modules/big.js')#dont like this at all but it is a solution for right now
	# shutil.copyfile('./node_modules/big.js/big.js', './src/main/node_modules/big.js')
	# print ('Copied Big.js to dependancies')

def stat():
	print ('stat')
	return [os.stat(file).st_mtime for file in sources()]

def monitor():
	a = stat()
	while True:
		time.sleep(0.5)
		b = stat()
		if a != b:
			a = b
			build()

if __name__ == '__main__':
	build()
	if '--watch' in sys.argv:
		monitor()