# Changes in the learning algorithm:

Triplie will learn associations from continuous blocks of texts 
written by another user and n-grams from lines written by
the users.

Two special words will be added: the "beginning" and the "end",
to allow triplie to finish a sentence.


# Changes in the response algorithm:

Normally, triplie extracts keywords, expands them by querying the
association net then uses the expanded keywords to connect through
the n-gram.

In the process, associated keywords are excited by the amount of 
mutual information that is available.

The modified algorithm will be a bit more complex (but a superset
of the original algorithm):

## Extract keywords 

Instead of looking for the rarest of  keywords, look for something 
that at least satisfies minimum frequency e.g. 1 or 2 occurences.
(configurable)

The value of course is still the accumulated mutual information.

The final data structure is a list of keywords:

```js
    [k1, k2, k3, ... kN]
```

## Expand and cluster using a stemmer

Expand the initial set of keywords by finding words that have the
same base form. The base form similarity checker can be plugged in,
for example an english-specific stemmer can be used, or a levenstein
comparison can be used (anything that compares two words and says
true if the word is basically the same) or maybe a stemmer that
always returns false.

The resulting data structure is a list word clusters

```js
[[id11, ...], [id21, ...] ...]
```

## Expand by associations, group using stemmer.

For every expansion find the associated keywords. 

Lots of associations and expansions are now found

The result - two sets of words - original (expanded)
and associated, grouped (clustered) using the
selected stemmer.

```js
{
    expanded:[[id11, ...], [id21, ...] ...],
    associated: [[id11, ...], ...]
}
```

## Calculate mutual information between clusters

Given all expanded and associated clusters, calculate
mutual information between each expanded - associated pair.

Sum the mutual information grouping by each associated
cluster.

The end result is a list of associated clusters with values:

```js
[ {words: [...], value: x}, ... ]
```

## Expand associated clusters using n-gram context similarity.

Each of the clusters from the previous phase will be expanded 
with an n-gram context similarity search. This is how this algorithm 
works:

1) Find all the n-grams where a word from the cluster is in the 
middle

2) Find all the words which can also be placed in at least K of those 
n-grams (K is configurable)

The end result are expanded clusters with an object for each 
alternative words that also contains the original word:

```js
[[{id: id, original: id}, ...], [...], ...]
```

## Do multiple-BFS on the ngram graph

Every cluster now needs to be found using n-gram breadth
first search. If any acceptable alternative is found we can continue
with the search even though the "wrong" word was found, but we
mark what the right word is in that position (its whatever the
value of sourceExpansion is)

When the (configurable) minimum number of keywords is reached, the 
algorithm is allowed to find the "startword" or the "endword".

If the algorithm does not reach the minimum number of keywords
its restarted to begin from the next available cluster.

After the search is complete we go through all the marked words
and replace them with their originals.

