# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  # For a complete reference, please see the online documentation at
  # https://docs.vagrantup.com.

  config.vm.box = "ubuntu/trusty64"
  # config.vm.provision :shell, path: "provisioning.sh"

  # https://www.elastic.co/guide/en/elasticsearch/reference/5.0/_maximum_map_count_check.html
  # https://www.elastic.co/guide/en/elasticsearch/reference/5.0/vm-max-map-count.html
  # https://www.elastic.co/guide/en/elasticsearch/reference/5.0/docker.html#docker-cli-run-prod-mode
  # http://stackoverflow.com/questions/11683850/how-much-memory-could-vm-use-in-linux
  # https://www.kernel.org/doc/Documentation/sysctl/vm.txt
  config.vm.provision :shell, inline: "sysctl -w vm.max_map_count=262144", run: "always"

  config.vm.provision :docker
  # To use docker_compose as a provisioning tool, install
  # vagrant-docker-compose plugin first. It should also solve the
  # "The '' provisioner could not be found." error:
  # $ vagrant plugin install vagrant-docker-compose
  # cf. https://github.com/leighmcculloch/vagrant-docker-compose
  config.vm.provision :docker_compose,
    run: "always",
    yml: [
      "/vagrant/docker-compose.yml",
      "/vagrant/docker-compose.override.yml"
    ]

  # Peuplement + Updates
  config.vm.provision :shell, inline: "docker-compose -f /vagrant/docker-compose.yml -f /vagrant/docker-compose.admin.yml run data recover_par_1_0"
  config.vm.provision :shell, inline: "docker-compose -f /vagrant/docker-compose.yml -f /vagrant/docker-compose.admin.yml run data from_par_1_0_to_1_1"
  config.vm.provision :shell, inline: "docker-compose -f /vagrant/docker-compose.yml -f /vagrant/docker-compose.admin.yml run data delete_par_1_0"
  config.vm.provision :shell, inline: "docker-compose -f /vagrant/docker-compose.yml -f /vagrant/docker-compose.admin.yml run data recover_anfh_1_0"
  config.vm.provision :shell, inline: "docker-compose -f /vagrant/docker-compose.yml -f /vagrant/docker-compose.admin.yml run data update_1_par_1_1"

  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine. In the example below,
  # accessing "localhost:8080" will access port 80 on the guest machine.
  # config.vm.network "forwarded_port", guest: 80, host: 8080
  # UI
  config.vm.network "forwarded_port", guest: 8080, host: 8080
  # API
  config.vm.network "forwarded_port", guest: 8081, host: 8081
  # Visualisation
  config.vm.network "forwarded_port", guest: 8082, host: 8082
  # DB ElasticSearch
  config.vm.network "forwarded_port", guest: 9200, host: 9200
  config.vm.network "forwarded_port", guest: 9300, host: 9300
  # MGMT Kibana
  config.vm.network "forwarded_port", guest: 5601, host: 5601

  config.vm.provider "virtualbox" do |vb|
    # Use VBoxManage to customize the VM.
    vb.customize ["modifyvm", :id, "--memory", "4096"]

    # http://stackoverflow.com/questions/24200333/symbolic-links-and-synced-folders-in-vagrant
    vb.customize ["setextradata", :id, "VBoxInternal2/SharedFoldersEnableSymlinksCreate/v-root", "1"]
  end

end
