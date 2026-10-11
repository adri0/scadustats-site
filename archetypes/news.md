---
title: "{{ replaceRE `^\d{4}-\d{2}-\d{2}-` "" .File.ContentBaseName | humanize }}"
date: {{ .Date | time.Format "2006-01-02" }}
summary: ""
# A key of params.authors in hugo.toml, which links the name.
author: ""
---
