# Use scp inst.sh connor@20.254.68.254:/home/connor
echo "Update linux, install node, npm and mysql"
#All linux installed packages are held in the system are listed in an index file "/etc/apt/sources.list"
# apt (advanced packaging tool) update or apt-get update will update the installed packages list to point to new versions
sudo apt-get update

#install CA certificates and curl app and the gnu version of pgp for secure data transfer
# These will be the latest version given the updated index file from update
sudo apt-get install -y ca-certificates curl gnupg

#Create a dir for the keyring to hold public keys. -p is "don't fail if dit already exists"
sudo mkdir -p /etc/apt/keyrings

#-f fail fast, -s silent, -S show errors even if silent, -L follow redirects
#get the gpg public key for the node source and pipe the key into the keyring. --dearmor converts the ascii key into binary. -o means write to output file
#https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key to have a look at the key
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

# set an env var to the version we want. Write the full endpoint including version to stdout and into a file (using tee)
NODE_MAJOR=20
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list

#run update again to update the index file with our pointer to node now able to use https as we have the public key
sudo apt-get update

#now we can install node as apt knows where it is and has its public key to use in the secure session
sudo apt-get install nodejs -y
