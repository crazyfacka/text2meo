text2meo
========

It takes input from text files to create playlists for the MEO Music application.

By using this application you might violate the Terms of Service of MEO Music. This is based on an undocumented API to create the playlists and add the respective tracks.

As it is somewhat obvious, the author does not accept any liability for any loss regarding these services or for burning down your house from the use of this tool. Use it (and improve it!) at your own risk.

Building text2meo
=================

- Make sure you have installed a usable build environment (gcc, make, etc.)
- Install Node.js (this was tested on v0.10.28)
- Clone the master branch
- Go into the **data** directory and run **npm install**
- Run the application by executing:

``` bash
$ node text2meo.js <file_name>
```

Notes
=====
For now the application is only parsing files in the following format:

```
<artist> - <track_name>
<artist> - <track_name>
...
```

ToDo
====

- Improve matching algorithm
- Retrieve the session ID automatically
	- Figure out how it is calculated *OR*
	- Sniff it out by having **tcpdump** running alongside the application