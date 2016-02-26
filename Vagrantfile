# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  # For a complete reference, please see the online documentation at
  # https://docs.vagrantup.com.

  config.vm.box = "ubuntu/trusty64"
  # config.vm.provision :shell, path: "provisioning.sh"
  config.vm.provision :docker
  # To use docker_compose as a provisioning tool, install
  # vagrant-docker-compose plugin first. It should also solve the
  # "The '' provisioner could not be found." error:
  # $ vagrant plugin install vagrant-docker-compose
  # c. https://github.com/leighmcculloch/vagrant-docker-compose
  config.vm.provision :docker_compose, compose_version: "1.6.2", run: "always", yml: "/vagrant/docker-compose.yml"

  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine. In the example below,
  # accessing "localhost:8080" will access port 80 on the guest machine.
  # config.vm.network "forwarded_port", guest: 80, host: 8080
  # UI
  config.vm.network "forwarded_port", guest: 80, host: 8080
  # API
  config.vm.network "forwarded_port", guest: 81, host: 8081
  # DB ElasticSearch
  config.vm.network "forwarded_port", guest: 9200, host: 9200
  config.vm.network "forwarded_port", guest: 9300, host: 9300
  # MGMT Kibana
  config.vm.network "forwarded_port", guest: 5601, host: 5601

  config.vm.provider "virtualbox" do |vb|
    # Use VBoxManage to customize the VM.
    vb.customize ["modifyvm", :id, "--memory", "2048"]

    # http://stackoverflow.com/questions/24200333/symbolic-links-and-synced-folders-in-vagrant
    vb.customize ["setextradata", :id, "VBoxInternal2/SharedFoldersEnableSymlinksCreate/v-root", "1"]
  end

end
