#!/bin/bash
# stuff=$(cat export | grep '/testbench/i_dut/inst_UDPStack/' | grep -v 'inst_altdpram' | grep -v 'esg_scfifo_ext_i' | grep -v 'esg_scfifo_ext_core_i' | grep -v 'inst_esg_scfifo_to_altera' | grep -v g_altera | grep -v 'DCFIFO_MW/' | sed 's,/testbench/i_dut/,,g' |sed 's/[(].*[)]//g' | sed 's_/[^/]+$__g' | sed 's_^/__g' | sed 's_/_->_g')
# (echo 'strict digraph {'; echo "$stuff"; echo '}') > graph
# dot graph -Tpng -o graph.png


# make nice chart from questasim


# find instances -recursive -file instList sim:/tbSIFT/dut/*
# //
export0=$(cat $1 |grep i_dut\/ | sed 's,^/testbench/i_dut\s*,,g' | grep -v 'inst_AXIMaster/' | grep -v 'inst_dcfifo_mixed_widths' | grep -v 'DCFIFO_MW' | grep -v 'esg_scfifo_ext_i' | grep -v 'esg_scfifo_ext_core_i' | grep -v 'ALTERA_' | grep -v 'dcfifo_async' | sed '/fourteennm/ d' | sed '/altera/ d' | sed '/dspba/ d' | sed '/float/ d')
nodes=$(echo "$export0" |sed 's,[^/]*([0-9]*)/,,g' |  sed 's,\([^/]\+\) *(\([a-zA-Z0-9_]\+\))$,\1 [label="\1\n\2"],g' | tr '/().' '_')
edges=$(echo "$export0" |  egrep -o '^[^ ]*' | sed 's,[^/]*([0-9]*)/,,g' |    sed 's;\(.*\)/\([^/]\+\)$; \1 -> \1_\2;g' | tr '.()/' '_' | grep -v '^\s*->')
# cat export0 |  egrep -o '^[^ ]*' | sed 's,[^/]*([0-9]*)/,,g' |    sed 's;\(.*\)/\([^/]\+\)$;\1_h [ label="", size=0, shape=point]\n \1:e -> \1_h [arrowhead=none]\n \1_h -> \1_\2:w;g' | tr '.()/' '_' > edges
(echo "strict digraph { rankdir=LR; node [shape=box  width=3.3]; splines=ortho; overlap=false;ranksep=1.2312321312  "; echo "$nodes"; echo $edges; echo "}") | dot -Tpdf > $2
# \\| dot -Tsvg
