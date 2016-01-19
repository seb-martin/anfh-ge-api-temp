

== Problème #1

=== A l'ANFH, le problème suivant se pose

```
ECMDERR Failed to execute "git ls-remote --tags --heads git://github.com/PolymerElements/iron-elements.git", exit code of #128 fatal: unable to connect to github.com: github.com[0: 192.30.252.130]: errno=No error

Additional error details:
fatal: unable to connect to github.com:
github.com[0: 192.30.252.130]: errno=No error
```


== La solution

https://github.com/angular/angular-phonecat/issues/141

`git config --global url."https://".insteadOf git://`
