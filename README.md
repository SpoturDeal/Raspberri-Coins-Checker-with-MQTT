# Raspberri-Coins-Checker-with-MQTT
A NodeJS script to get the values of your cryptocoins which you can publish with mqtt.

# Set up your Raspberri
Follow the standard set up for your raspberri.

# Add NodeJS, MQTT, bitvavo

This script runs on NodeJS and need to be installed on the raspberry

Connect to Raspberry Pi via SSH and add NodeSource repository that maintains Node.js 16 binary distributions:

```
curl -sSL https://deb.nodesource.com/setup_16.x | sudo bash -
```

Run command to install Node.js:
 
 ```
 sudo apt install -y nodejs
 ```
 
 Note that, we don’t need to install npm separately, it comes bundled with Node.js. After the installation is complete, check Node.js and npm versions:
 If you see the versions the installation is succesfull.
 
 ```
 node --version
 npm --version
 ```

Now install MQTT

```
sudo npm install mqtt --save
```

Then install the command line tools

```
sudo npm install mqtt -g
```

The only missing requirement is bitvao

```
sudo npm install -y bitvavo
```

Copy the coins-check.js file to your directory.

# Use nano to enter your own credentials.

To start to script.

```
node coins-check.js
```

You can check with MQTT Explorer if the data is being published.

To autostart the script after reboot or startup edit your /etc/rc.local file
Add the following line

```
node /home/pi/coins-check.js
```

