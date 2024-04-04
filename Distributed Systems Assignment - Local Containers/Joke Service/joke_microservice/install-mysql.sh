
#install mysql 8 - this should be the latest in this version of ubuntu
# lsb_release -a 
#shows Ubuntu 20.04.6 LTS  Codename: focal
sudo apt-get -y update
sudo apt-get -y install mysql-server

#Execute the following to go back to old auth and use mysql in node not mysql2
#sudo mysql
#SELECT plugin from mysql.user where User='root'; 
#UPDATE mysql.user SET plugin = 'mysql_native_password' WHERE User = 'root';
#FLUSH PRIVILEGES;
#ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_new_password';
#exit
#sudo systemctl restart mysql.service
#mysqladmin -u root -p ping